"use client";

import { ChevronLeft, ChevronRight, Copy, LoaderCircle, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { deleteMedia, getMediaUsage, listMedia, type MediaPage, updateMediaDetails } from "@/lib/cms/actions/media";
import { callAction } from "@/lib/cms/call-action";
import { MEDIA_FOLDERS } from "@/lib/cms/constants";
import type { MediaItem } from "@/lib/cms/fields";
import { IMAGE_ACCEPT, replaceMedia, uploadMedia, VIDEO_ACCEPT } from "@/lib/cms/upload";
import type { MediaFolder } from "@/lib/supabase/database.types";
import { MediaThumb } from "../fields/MediaThumb";
import { useConfirm, useToast } from "../providers";
import { Badge, Button, Card, EmptyState, IconButton, inputClass } from "../ui";

type LibraryItem = MediaPage["items"][number];
type Usage = { area: string; label: string; href: string };

const fileSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

function MediaDetails({ item, onClose, onChanged, onDeleted }: { item: LibraryItem; onClose: () => void; onChanged: (item: LibraryItem) => void; onDeleted: (id: string) => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  // Shown inside the dialog, because a modal dialog covers the page's own messages.
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  const [altEn, setAltEn] = useState(item.alt.en ?? "");
  const [altAr, setAltAr] = useState(item.alt.ar ?? "");
  const [folder, setFolder] = useState<MediaFolder>(item.folder);
  const [usage, setUsage] = useState<Usage[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    let active = true;
    void callAction(() => getMediaUsage(item.id)).then((result) => {
      if (!active) return;
      if (result.ok) setUsage(result.data);
      else setNotice({ tone: "error", message: result.error });
    });
    return () => {
      active = false;
    };
  }, [item.id]);

  const dirty = altEn !== (item.alt.en ?? "") || altAr !== (item.alt.ar ?? "") || folder !== item.folder;

  const save = async () => {
    setSaving(true);
    const result = await callAction(() => updateMediaDetails(item.id, { alt: { en: altEn, ar: altAr }, folder }));
    setSaving(false);
    if (result.ok) {
      onChanged({ ...item, alt: { ...(altEn.trim() ? { en: altEn.trim() } : {}), ...(altAr.trim() ? { ar: altAr.trim() } : {}) }, folder });
      setNotice({ tone: "success", message: "Saved." });
    } else {
      setNotice({ tone: "error", message: result.error });
    }
  };

  const replace = async (file: File | undefined) => {
    if (!file) return;
    setReplacing(true);
    const result = await replaceMedia(item.id, file, item.folder);
    setReplacing(false);
    if (replaceRef.current) replaceRef.current.value = "";
    if (result.ok) {
      onChanged({ ...result.item, uses: item.uses });
      setNotice({ tone: "success", message: item.uses > 0 ? "Replaced. Every place using this file now shows the new one." : "Replaced." });
    } else {
      setNotice({ tone: "error", message: result.error });
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: `Delete “${item.original_name}”?`,
      message: "This removes the file for good. Nothing on the website is using it.",
      confirmLabel: "Delete file",
      danger: true,
    });
    if (!ok) return;

    setDeleting(true);
    const result = await callAction(() => deleteMedia(item.id));
    setDeleting(false);
    if (result.ok) {
      toast.success("File deleted.");
      onDeleted(item.id);
    } else {
      setNotice({ tone: "error", message: result.error });
      const latest = await callAction(() => getMediaUsage(item.id));
      if (latest.ok) setUsage(latest.data);
    }
  };

  const inUse = usage !== null && usage.length > 0;

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Details for ${item.original_name}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl bg-white p-0 text-ink shadow-2xl"
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-3">
        <h2 className="min-w-0 truncate font-heading text-lg font-bold">{item.original_name}</h2>
        <IconButton label="Close" onClick={onClose}>
          <X aria-hidden className="size-4" />
        </IconButton>
      </header>

      {notice && (
        <p role={notice.tone === "error" ? "alert" : "status"} className={`px-5 py-3 text-sm font-medium ${notice.tone === "error" ? "bg-pop/20" : "bg-lime/40"}`}>
          {notice.message}
        </p>
      )}

      <div className="grid gap-5 p-5 md:grid-cols-2">
        <div>
          {item.kind === "video" ? (
            <video src={item.url} controls preload="metadata" className="aspect-video w-full rounded-xl bg-ink" />
          ) : (
            <MediaThumb item={item} className="aspect-square w-full rounded-xl ring-1 ring-ink/10" sizes="(min-width: 768px) 28rem, 100vw" />
          )}
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <dt className="text-ink/65">Size</dt>
            <dd>{fileSize(item.size_bytes)}</dd>
            {item.width && item.height && (
              <>
                <dt className="text-ink/65">Dimensions</dt>
                <dd>
                  {item.width} x {item.height} pixels
                </dd>
              </>
            )}
            <dt className="text-ink/65">Type</dt>
            <dd>{item.mime_type}</dd>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              ref={replaceRef}
              type="file"
              accept={item.kind === "video" ? VIDEO_ACCEPT : IMAGE_ACCEPT}
              className="sr-only"
              aria-label="Choose a replacement file"
              onChange={(event) => replace(event.target.files?.[0])}
            />
            <Button variant="secondary" size="sm" loading={replacing} onClick={() => replaceRef.current?.click()}>
              <RefreshCw aria-hidden className="size-4" />
              {replacing ? "Replacing..." : "Replace file"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(item.url);
                setNotice({ tone: "success", message: "Address copied." });
              }}
            >
              <Copy aria-hidden className="size-4" />
              Copy address
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-1.5 text-sm font-semibold">Description of the image</p>
            <p className="mb-2 text-xs leading-relaxed text-ink/65">Read aloud by screen readers and used by search engines. Describe what the image shows.</p>
            <div className="flex flex-col gap-2">
              <input type="text" value={altEn} aria-label="Description in English" placeholder="English" className={inputClass} onChange={(event) => setAltEn(event.target.value)} />
              <input type="text" value={altAr} dir="rtl" lang="ar" aria-label="Description in Arabic" placeholder="العربية" className={inputClass} onChange={(event) => setAltAr(event.target.value)} />
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Folder</span>
            <select value={folder} className={inputClass} onChange={(event) => setFolder(event.target.value as MediaFolder)}>
              {MEDIA_FOLDERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <Button loading={saving} disabled={!dirty} onClick={save} className="w-fit">
            {saving ? "Saving..." : "Save details"}
          </Button>

          <div className="border-t border-ink/10 pt-4">
            <h3 className="text-sm font-semibold">Where this file is used</h3>
            {usage === null ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-ink/65">
                <LoaderCircle aria-hidden className="size-4 animate-spin" />
                Checking...
              </p>
            ) : usage.length === 0 ? (
              <p className="mt-2 text-sm text-ink/65">Not used anywhere on the website.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {usage.map((place, index) => (
                  <li key={`${place.href}-${index}`}>
                    <Link href={place.href} className="font-medium text-brand underline underline-offset-2">
                      {place.area}: {place.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Button variant="danger" size="sm" className="mt-3" loading={deleting} disabled={usage === null || inUse} onClick={remove}>
              <Trash2 aria-hidden className="size-4" />
              Delete file
            </Button>
            {inUse && <p className="mt-2 text-xs leading-relaxed text-ink/65">This file cannot be deleted while it is in use. Remove it from the places above first, or use “Replace file” to swap it everywhere at once.</p>}
          </div>
        </div>
      </div>
    </dialog>
  );
}

/** Every file on the website: browse, search, upload, replace, describe and safely delete. */
export function MediaLibrary() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("");
  const [kind, setKind] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MediaPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<string | null>(null);
  const [selected, setSelected] = useState<LibraryItem | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [uploadFolder, setUploadFolder] = useState<MediaFolder>("other");

  const load = useCallback(async () => {
    setLoading(true);
    const result = await callAction(() => listMedia({ search, folder, kind, page }));
    setLoading(false);
    if (result.ok) setData(result.data);
    else toast.error(result.error);
  }, [search, folder, kind, page, toast]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const upload = async (files: FileList | File[] | null) => {
    const list = Array.from(files ?? []);
    if (list.length === 0) return;

    let uploaded = 0;
    for (const [index, file] of list.entries()) {
      setProgress(list.length === 1 ? "Uploading..." : `Uploading ${index + 1} of ${list.length}...`);
      const result: { ok: true; item: MediaItem } | { ok: false; error: string } = await uploadMedia(file, uploadFolder);
      if (result.ok) uploaded += 1;
      else toast.error(result.error);
    }
    setProgress(null);
    if (fileRef.current) fileRef.current.value = "";
    if (uploaded > 0) {
      toast.success(uploaded === 1 ? "File uploaded." : `${uploaded} files uploaded.`);
      if (page === 1) await load();
      else setPage(1);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const filtering = Boolean(search || folder || kind);

  return (
    <div className="flex flex-col gap-4">
      <Card title="Upload" description="Images up to 15 MB (JPG, PNG, WebP, AVIF, GIF, SVG, ICO). Videos up to 50 MB (MP4, WebM).">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDropActive(true);
          }}
          onDragLeave={() => setDropActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDropActive(false);
            void upload(event.dataTransfer.files);
          }}
          className={`flex flex-wrap items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-colors ${dropActive ? "border-brand bg-soft" : "border-ink/20"}`}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={`${IMAGE_ACCEPT},${VIDEO_ACCEPT}`}
            className="sr-only"
            aria-label="Choose files to upload"
            onChange={(event) => upload(event.target.files)}
          />
          <Button loading={progress !== null} onClick={() => fileRef.current?.click()}>
            <Upload aria-hidden className="size-4" />
            {progress ?? "Choose files"}
          </Button>
          <span className="text-sm text-ink/70">or drop them here, into</span>
          <label>
            <span className="sr-only">Folder for new uploads</span>
            <select value={uploadFolder} className={`${inputClass} w-auto`} onChange={(event) => setUploadFolder(event.target.value as MediaFolder)}>
              {MEDIA_FOLDERS.filter((option) => option.value !== "video").map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card title={data ? `${data.total} ${data.total === 1 ? "file" : "files"}` : "Files"}>
        <div className="mb-4 flex flex-wrap gap-2">
          <label className="relative min-w-52 flex-1">
            <span className="sr-only">Search files</span>
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/50" />
            <input
              type="search"
              value={search}
              placeholder="Search by name or description"
              className={`${inputClass} pl-9`}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label>
            <span className="sr-only">Filter by folder</span>
            <select
              value={folder}
              className={inputClass}
              onChange={(event) => {
                setFolder(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All folders</option>
              {MEDIA_FOLDERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by type</span>
            <select
              value={kind}
              className={inputClass}
              onChange={(event) => {
                setKind(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Images and videos</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
          </label>
        </div>

        <div aria-busy={loading} aria-live="polite">
          {!data ? (
            <p className="flex items-center justify-center gap-2 py-12 text-sm text-ink/65">
              <LoaderCircle aria-hidden className="size-4 animate-spin" />
              Loading files...
            </p>
          ) : data.items.length === 0 ? (
            <EmptyState title={filtering ? "No files match your search" : "The library is empty"}>{filtering ? "Try a different word or folder." : "Upload your first file above."}</EmptyState>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {data.items.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => setSelected(item)} className="block w-full overflow-hidden rounded-xl text-left ring-1 ring-ink/10 transition hover:ring-2 hover:ring-brand">
                    <MediaThumb item={item} className="aspect-square w-full" sizes="200px" />
                    <span className="block truncate px-2 pt-1.5 text-xs font-medium">{item.original_name}</span>
                    <span className="flex items-center gap-1 px-2 pb-2 pt-1">{item.uses > 0 ? <Badge tone="live">Used in {item.uses}</Badge> : <Badge>Not used</Badge>}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1 text-sm">
            <IconButton label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft aria-hidden className="size-4" />
            </IconButton>
            Page {page} of {totalPages}
            <IconButton label="Next page" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight aria-hidden className="size-4" />
            </IconButton>
          </div>
        )}
      </Card>

      {selected && (
        <MediaDetails
          key={selected.id}
          item={selected}
          onClose={() => setSelected(null)}
          onChanged={(item) => {
            setSelected(item);
            setData((current) => current && { ...current, items: current.items.map((entry) => (entry.id === item.id ? item : entry)) });
          }}
          onDeleted={() => {
            setSelected(null);
            void load();
          }}
        />
      )}
    </div>
  );
}
