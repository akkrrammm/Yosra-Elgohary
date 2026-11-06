"use client";

import { createClient } from "@/lib/supabase/client";
import type { MediaFolder, MediaKind } from "@/lib/supabase/database.types";
import { discardUpload, registerMedia, replaceMediaFile, type UploadedFile } from "./actions/media";
import { callAction } from "./call-action";
import { IMAGE_BUCKET, IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, VIDEO_BUCKET, VIDEO_TYPES } from "./constants";
import type { MediaItem } from "./fields";

export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");
export const VIDEO_ACCEPT = VIDEO_TYPES.join(",");

const megabytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

/** Checks a file before anything is uploaded. The bucket enforces the same limits on the server. */
export function checkFile(file: File): { kind: MediaKind; error?: undefined } | { error: string; kind?: undefined } {
  if (IMAGE_TYPES.includes(file.type)) {
    if (file.size > MAX_IMAGE_BYTES) return { error: `“${file.name}” is too large. Images can be up to ${megabytes(MAX_IMAGE_BYTES)}.` };
    return { kind: "image" };
  }
  if (VIDEO_TYPES.includes(file.type)) {
    if (file.size > MAX_VIDEO_BYTES) return { error: `“${file.name}” is too large. Videos can be up to ${megabytes(MAX_VIDEO_BYTES)}.` };
    return { kind: "video" };
  }
  return { error: `“${file.name}” is not a supported file. Use JPG, PNG, WebP, AVIF, GIF, SVG, ICO, MP4 or WebM.` };
}

function imageSize(file: File) {
  return new Promise<{ width: number | null; height: number | null }>((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth || null, height: image.naturalHeight || null });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

function videoSize(file: File) {
  return new Promise<{ width: number | null; height: number | null }>((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth || null, height: video.videoHeight || null });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    video.src = url;
  });
}

const safeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "file";

const extensionOf = (file: File) => {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  return fromName && /^[a-z0-9]{2,5}$/.test(fromName) ? fromName : file.type.split("/")[1]?.replace(/\W/g, "") || "bin";
};

/** Sends the file straight to Storage, so large files never pass through the website's server. */
async function uploadToStorage(file: File, folder: MediaFolder): Promise<{ ok: true; uploaded: UploadedFile } | { ok: false; error: string }> {
  const check = checkFile(file);
  if (check.error !== undefined) return { ok: false, error: check.error };

  const kind = check.kind;
  const bucket = kind === "video" ? VIDEO_BUCKET : IMAGE_BUCKET;
  // The random id means a file attached to a draft cannot be guessed, and a new file is never served from an old cache.
  const path = `${kind === "video" ? "video" : folder}/${crypto.randomUUID()}-${safeName(file.name)}.${extensionOf(file)}`;
  const { width, height } = kind === "video" ? await videoSize(file) : await imageSize(file);

  const { error } = await createClient().storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    console.error("[cms] upload:", error.message);
    return { ok: false, error: `“${file.name}” could not be uploaded. Please check your connection and try again.` };
  }

  return {
    ok: true,
    uploaded: {
      bucket,
      path,
      kind,
      folder: kind === "video" ? "video" : folder,
      mime_type: file.type,
      size_bytes: file.size,
      width,
      height,
      original_name: file.name,
    },
  };
}

export async function uploadMedia(file: File, folder: MediaFolder): Promise<{ ok: true; item: MediaItem } | { ok: false; error: string }> {
  const result = await uploadToStorage(file, folder);
  if (!result.ok) return result;

  const registered = await callAction(() => registerMedia(result.uploaded));
  if (!registered.ok) {
    await callAction(() => discardUpload(result.uploaded.bucket, result.uploaded.path));
    return { ok: false, error: registered.error };
  }
  return { ok: true, item: registered.data };
}

export async function replaceMedia(mediaId: string, file: File, folder: MediaFolder): Promise<{ ok: true; item: MediaItem } | { ok: false; error: string }> {
  const result = await uploadToStorage(file, folder);
  if (!result.ok) return result;

  const replaced = await callAction(() => replaceMediaFile(mediaId, result.uploaded));
  if (!replaced.ok) {
    await callAction(() => discardUpload(result.uploaded.bucket, result.uploaded.path));
    return { ok: false, error: replaced.error };
  }
  return { ok: true, item: replaced.data };
}
