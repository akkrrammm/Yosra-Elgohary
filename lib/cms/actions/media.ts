"use server";

import { z } from "zod";
import { type ActionResult, asAdmin, explainError, failure, GONE, publishChanges, success, successWith } from "../admin";
import { IMAGE_BUCKET, MEDIA_FOLDERS, VIDEO_BUCKET } from "../constants";
import type { MediaItem } from "../fields";
import { toMediaItem } from "../media-records";

const PAGE_SIZE = 24;

const uploadedFile = z.object({
  bucket: z.enum([IMAGE_BUCKET, VIDEO_BUCKET]),
  path: z.string().min(1).max(512),
  kind: z.enum(["image", "video"]),
  folder: z.enum(MEDIA_FOLDERS.map((folder) => folder.value)),
  mime_type: z.string().min(1).max(100),
  size_bytes: z.number().int().nonnegative(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  original_name: z.string().max(255),
});

export type UploadedFile = z.infer<typeof uploadedFile>;

/** Records a file that the browser has just uploaded straight to Storage. */
export async function registerMedia(file: UploadedFile): Promise<ActionResult<MediaItem>> {
  const parsed = uploadedFile.safeParse(file);
  if (!parsed.success) return failure("This file could not be added to the library.");

  return asAdmin(async (supabase, user) => {
    const { data, error } = await supabase
      .from("media_assets")
      .insert({ ...parsed.data, uploaded_by: user.id })
      .select("*")
      .single();
    if (error) return explainError(error);
    return successWith(toMediaItem(data));
  });
}

export type MediaPage = { items: (MediaItem & { uses: number })[]; total: number; page: number; pageSize: number };

export async function listMedia(options: { search?: string; folder?: string; kind?: string; page?: number }): Promise<ActionResult<MediaPage>> {
  const page = Math.max(1, Math.floor(options.page ?? 1));

  return asAdmin(async (supabase) => {
    let query = supabase
      .from("media_assets")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id")
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    const search = options.search?.trim().replace(/[%_,()]/g, " ");
    if (search) query = query.or(`original_name.ilike.%${search}%,alt->>en.ilike.%${search}%,alt->>ar.ilike.%${search}%`);
    if (options.folder) query = query.eq("folder", options.folder as MediaItem["folder"]);
    if (options.kind) query = query.eq("kind", options.kind as MediaItem["kind"]);

    const { data, error, count } = await query;
    if (error) return explainError(error);

    const ids = (data ?? []).map((row) => row.id);
    const uses = new Map<string, number>();
    if (ids.length > 0) {
      const { data: counts, error: countsError } = await supabase.rpc("media_usage_counts", { p_ids: ids });
      if (countsError) return explainError(countsError);
      for (const row of counts ?? []) uses.set(row.media_id, Number(row.uses));
    }

    return successWith({
      items: (data ?? []).map((row) => ({ ...toMediaItem(row), uses: uses.get(row.id) ?? 0 })),
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    });
  });
}

export async function getMediaUsage(mediaId: string): Promise<ActionResult<{ area: string; label: string; href: string }[]>> {
  if (!z.uuid().safeParse(mediaId).success) return failure("This file could not be found.");

  return asAdmin(async (supabase) => {
    const { data, error } = await supabase.rpc("media_usage", { p_media_id: mediaId });
    if (error) return explainError(error);
    return successWith(data ?? []);
  });
}

export async function updateMediaDetails(mediaId: string, details: { alt: { en?: string; ar?: string }; folder: string }): Promise<ActionResult> {
  if (!z.uuid().safeParse(mediaId).success) return failure("This file could not be found.");

  const alt: { en?: string; ar?: string } = {};
  if (details.alt.en?.trim()) alt.en = details.alt.en.trim();
  if (details.alt.ar?.trim()) alt.ar = details.alt.ar.trim();

  const folder = MEDIA_FOLDERS.find((item) => item.value === details.folder)?.value;
  if (!folder) return failure("Please choose a folder from the list.");

  return asAdmin(async (supabase) => {
    const { data, error } = await supabase.from("media_assets").update({ alt, folder }).eq("id", mediaId).select("id");
    if (error) return explainError(error);
    if (!data.length) return GONE;
    publishChanges();
    return success();
  });
}

/**
 * Points an existing library item at a newly uploaded file. Everything using it keeps
 * working and shows the new file, then the old file is removed.
 */
export async function replaceMediaFile(mediaId: string, file: UploadedFile): Promise<ActionResult<MediaItem>> {
  if (!z.uuid().safeParse(mediaId).success) return failure("This file could not be found.");
  const parsed = uploadedFile.safeParse(file);
  if (!parsed.success) return failure("This file could not be used.");

  return asAdmin(async (supabase) => {
    const { data: current, error: readError } = await supabase.from("media_assets").select("*").eq("id", mediaId).single();
    if (readError) return explainError(readError);
    if (current.kind !== parsed.data.kind) return failure("Replace an image with an image, and a video with a video.");

    // The file stays in the folder it was organized into.
    const fileDetails = { ...parsed.data, folder: current.folder };
    const { data, error } = await supabase.from("media_assets").update(fileDetails).eq("id", mediaId).select("*").single();
    if (error) return explainError(error);

    const { error: removeError } = await supabase.storage.from(current.bucket).remove([current.path]);
    if (removeError) console.error("[cms] could not remove replaced file:", removeError.message);

    publishChanges();
    return successWith(toMediaItem(data));
  });
}

/** Refuses while anything still uses the file. The database enforces this as well. */
export async function deleteMedia(mediaId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(mediaId).success) return failure("This file could not be found.");

  return asAdmin(async (supabase) => {
    const { data: usage, error: usageError } = await supabase.rpc("media_usage", { p_media_id: mediaId });
    if (usageError) return explainError(usageError);
    if (usage && usage.length > 0) {
      const places = usage.map((place) => `${place.area}: ${place.label}`).join(", ");
      return failure(`This file is still used in ${usage.length === 1 ? "1 place" : `${usage.length} places`} (${places}). Remove it from there first.`);
    }

    const { data: file, error: readError } = await supabase.from("media_assets").select("bucket, path").eq("id", mediaId).single();
    if (readError) return explainError(readError);

    const { error } = await supabase.from("media_assets").delete().eq("id", mediaId);
    if (error) return explainError(error);

    const { error: removeError } = await supabase.storage.from(file.bucket).remove([file.path]);
    if (removeError) console.error("[cms] could not remove deleted file:", removeError.message);

    return success();
  });
}

/** Removes an uploaded file that never made it into the library. */
export async function discardUpload(bucket: string, path: string): Promise<ActionResult> {
  const parsedBucket = z.enum([IMAGE_BUCKET, VIDEO_BUCKET]).safeParse(bucket);
  if (!parsedBucket.success) return failure("This file could not be removed.");

  return asAdmin(async (supabase) => {
    const { data: inUse } = await supabase.from("media_assets").select("id").eq("bucket", parsedBucket.data).eq("path", path).maybeSingle();
    if (inUse) return failure("This file is in the library.");
    await supabase.storage.from(parsedBucket.data).remove([path]);
    return success();
  });
}

