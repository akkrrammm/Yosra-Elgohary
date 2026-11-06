"use client";

import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { GalleryInput } from "@/lib/cms/actions/projects";
import { MediaThumb } from "../fields/MediaThumb";
import { MediaPicker } from "../media/MediaPicker";
import { Button, EmptyState, IconButton, inputClass } from "../ui";

type Props = {
  items: GalleryInput[];
  onChange: (items: GalleryInput[]) => void;
  /** A "deck" project fans three chosen pages out on the homepage. */
  showDeck: boolean;
};

/** A project's images: add many at once, drag or nudge into order, caption, remove. */
export function GalleryEditor({ items, onChange, showDeck }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [dragHandle, setDragHandle] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const update = (index: number, change: Partial<GalleryInput>) => onChange(items.map((item, i) => (i === index ? { ...item, ...change } : item)));

  /** A position belongs to one page, so choosing it takes it away from any other. */
  const setDeckPosition = (index: number, position: number | null) =>
    onChange(
      items.map((item, i) => {
        if (i === index) return { ...item, deck_position: position };
        return position !== null && item.deck_position === position ? { ...item, deck_position: null } : item;
      }),
    );

  return (
    <div>
      {items.length === 0 ? (
        <EmptyState title="No images in this gallery yet">Add images to show them on the project page.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li
              key={item.media.id}
              // Only from the handle, so selecting text in a caption never starts a drag.
              draggable={dragHandle === index}
              onDragEnd={() => setDragHandle(null)}
              onDragStart={() => {
                dragIndex.current = index;
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(index);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(null);
                if (dragIndex.current !== null) move(dragIndex.current, index);
                dragIndex.current = null;
              }}
              className={`flex flex-wrap items-center gap-3 rounded-xl p-2 ring-1 transition-colors md:flex-nowrap ${dragOver === index ? "bg-soft ring-brand" : "ring-ink/10"}`}
            >
              <span aria-hidden onPointerDown={() => setDragHandle(index)} onPointerUp={() => setDragHandle(null)} className="hidden shrink-0 cursor-grab p-1 text-ink/40 md:block">
                <GripVertical className="size-4" />
              </span>
              <MediaThumb item={item.media} className="size-20 shrink-0 rounded-lg" sizes="80px" />

              <div className="grid min-w-52 flex-1 gap-2 md:grid-cols-2">
                <input
                  type="text"
                  value={item.caption.en ?? ""}
                  aria-label={`Caption for image ${index + 1} in English`}
                  placeholder="Caption (optional)"
                  className={inputClass}
                  onChange={(event) => update(index, { caption: { ...item.caption, en: event.target.value } })}
                />
                <input
                  type="text"
                  dir="rtl"
                  lang="ar"
                  value={item.caption.ar ?? ""}
                  aria-label={`Caption for image ${index + 1} in Arabic`}
                  placeholder="تعليق (اختياري)"
                  className={inputClass}
                  onChange={(event) => update(index, { caption: { ...item.caption, ar: event.target.value } })}
                />
              </div>

              {showDeck && (
                <label className="text-sm">
                  <span className="sr-only">Place of image {index + 1} in the homepage fan</span>
                  <select
                    value={item.deck_position ?? ""}
                    className={inputClass}
                    onChange={(event) => setDeckPosition(index, event.target.value ? Number(event.target.value) : null)}
                  >
                    <option value="">Not in the fan</option>
                    <option value="1">Fan: left</option>
                    <option value="2">Fan: center</option>
                    <option value="3">Fan: right</option>
                  </select>
                </label>
              )}

              <div className="flex shrink-0 items-center">
                <IconButton label={`Move image ${index + 1} up`} disabled={index === 0} onClick={() => move(index, index - 1)}>
                  <ArrowUp aria-hidden className="size-4" />
                </IconButton>
                <IconButton label={`Move image ${index + 1} down`} disabled={index === items.length - 1} onClick={() => move(index, index + 1)}>
                  <ArrowDown aria-hidden className="size-4" />
                </IconButton>
                <IconButton label={`Remove image ${index + 1} from the gallery`} onClick={() => onChange(items.filter((_, i) => i !== index))}>
                  <Trash2 aria-hidden className="size-4" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button variant="secondary" className="mt-3" onClick={() => setPickerOpen(true)}>
        <Plus aria-hidden className="size-4" />
        Add images
      </Button>

      <MediaPicker
        open={pickerOpen}
        multiple
        folder="projects"
        excludeIds={items.map((item) => item.media.id)}
        onClose={() => setPickerOpen(false)}
        onSelect={(chosen) => onChange([...items, ...chosen.map((media) => ({ media, caption: {}, deck_position: null }))])}
      />
    </div>
  );
}
