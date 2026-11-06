"use client";

import { Check, ChevronLeft, ChevronRight, Search, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { listMedia, type MediaPage } from "@/lib/cms/actions/media";
import { callAction } from "@/lib/cms/call-action";
import { MEDIA_FOLDERS } from "@/lib/cms/constants";
import type { MediaItem } from "@/lib/cms/fields";
import { IMAGE_ACCEPT, uploadMedia, VIDEO_ACCEPT } from "@/lib/cms/upload";
import type { MediaFolder, MediaKind } from "@/lib/supabase/database.types";
import { MediaThumb } from "../fields/MediaThumb";
import { Button, EmptyState, IconButton, inputClass } from "../ui";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called with the chosen files. Single-choice pickers get one item. */
  onSelect: (items: MediaItem[]) => void;
  multiple?: boolean;
  kind?: MediaKind;
  folder: MediaFolder;
  /** Already chosen files, shown as unavailable so the same file is not added twice. */
  excludeIds?: string[];
};

/**
 * Rendered on the page body rather than where it is used: it usually opens from inside a
 * form, and pressing Enter in its search box must not submit that form. Problems are shown
 * inside the dialog, because a modal dialog covers the page's own messages.
 */
export function MediaPicker({ open, onClose, onSelect, multiple, kind = "image", folder, excludeIds = [] }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MediaPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<MediaItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await callAction(() => listMedia({ search, folder: folderFilter, kind, page }));
    setLoading(false);
    if (result.ok) setData(result.data);
    else setErrors([result.error]);
  }, [search, folderFilter, kind, page]);

  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [open, load, search]);

  const close = () => {
    setSelected([]);
    setErrors([]);
    onClose();
  };

  const toggle = (item: MediaItem) => {
    if (!multiple) {
      onSelect([item]);
      close();
      return;
    }
    setSelected((current) => (current.some((entry) => entry.id === item.id) ? current.filter((entry) => entry.id !== item.id) : [...current, item]));
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setErrors([]);

    const uploaded: MediaItem[] = [];
    const problems: string[] = [];
    for (const file of Array.from(files)) {
      const result = await uploadMedia(file, folder);
      if (result.ok) uploaded.push(result.item);
      else problems.push(result.error);
    }

    setUploading(false);
    setErrors(problems);
    if (fileRef.current) fileRef.current.value = "";
    if (uploaded.length === 0) return;

    if (multiple) {
      setSelected((current) => [...current, ...uploaded]);
      if (page === 1) await load();
      else setPage(1);
    } else {
      onSelect([uploaded[0]]);
      close();
    }
  };

  if (!open) return null;

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label="Media library"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      className="m-auto h-[min(46rem,calc(100dvh-2rem))] w-[min(62rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-ink shadow-2xl"
    >
      <div className="flex h-full flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 p-4 md:px-6">
          <h2 className="font-heading text-xl font-bold tracking-tight">Choose {kind === "video" ? "a video" : multiple ? "images" : "an image"}</h2>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={kind === "video" ? VIDEO_ACCEPT : IMAGE_ACCEPT}
              multiple={multiple}
              className="sr-only"
              aria-label="Upload new files"
              onChange={(event) => onFiles(event.target.files)}
            />
            <Button variant="secondary" loading={uploading} onClick={() => fileRef.current?.click()}>
              <Upload aria-hidden className="size-4" />
              {uploading ? "Uploading..." : "Upload new"}
            </Button>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
          </div>
        </header>

        {errors.length > 0 && (
          <div role="alert" className="bg-pop/20 px-4 py-3 text-sm font-medium md:px-6">
            {errors.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-b border-ink/10 p-4 md:px-6">
          <label className="relative min-w-48 flex-1">
            <span className="sr-only">Search files</span>
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/50" />
            <input
              type="search"
              value={search}
              placeholder="Search by name or description"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className={`${inputClass} pl-9`}
            />
          </label>
          <label>
            <span className="sr-only">Filter by folder</span>
            <select
              value={folderFilter}
              onChange={(event) => {
                setFolderFilter(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All folders</option>
              {MEDIA_FOLDERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:px-6" aria-busy={loading}>
          {data && data.items.length === 0 ? (
            <EmptyState title={search || folderFilter ? "Nothing matches your search" : "The library is empty"}>Upload a file to get started.</EmptyState>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {data?.items.map((item) => {
                const taken = excludeIds.includes(item.id);
                const isSelected = selected.some((entry) => entry.id === item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={taken}
                      aria-pressed={multiple ? isSelected : undefined}
                      onClick={() => toggle(item)}
                      className={`group relative block w-full overflow-hidden rounded-xl text-left ring-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        isSelected ? "ring-brand" : "ring-transparent hover:ring-ink/30"
                      }`}
                    >
                      <MediaThumb item={item} className="aspect-square w-full" sizes="200px" />
                      <span className="block truncate px-1 py-1 text-xs text-ink/75">{item.original_name}</span>
                      {isSelected && (
                        <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-brand text-white">
                          <Check aria-hidden className="size-4" />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 p-4 md:px-6">
          <div className="flex items-center gap-1 text-sm">
            <IconButton label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              <ChevronLeft aria-hidden className="size-4" />
            </IconButton>
            <span>
              Page {page} of {totalPages}
            </span>
            <IconButton label="Next page" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
              <ChevronRight aria-hidden className="size-4" />
            </IconButton>
          </div>
          {multiple && (
            <Button
              disabled={selected.length === 0}
              onClick={() => {
                onSelect(selected);
                close();
              }}
            >
              Add {selected.length > 0 ? selected.length : ""} selected
            </Button>
          )}
        </footer>
      </div>
    </dialog>,
    document.body,
  );
}
