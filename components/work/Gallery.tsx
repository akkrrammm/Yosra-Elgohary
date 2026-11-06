"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "@/components/ui/Arrow";
import { ImageReveal } from "@/components/ui/Reveal";
import type { CmsImage } from "@/lib/cms/types";

type Labels = { label: string; close: string; prev: string; next: string; open: string; of: string };

/** Full width, then a pair, repeating. A last image left without a partner goes full width too. */
const isWide = (index: number, count: number) => index % 3 === 0 || (index === count - 1 && index % 3 === 1);

export function Gallery({ images, labels, isRtl }: { images: CmsImage[]; labels: Labels; isRtl: boolean }) {
  const [current, setCurrent] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const count = images.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (current !== null && !dialog.open) dialog.showModal();
    if (current === null && dialog.open) dialog.close();
  }, [current]);

  const step = (delta: number) => setCurrent((value) => (value === null ? value : (value + delta + count) % count));

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:gap-6">
        {images.map((image, index) => (
          <li key={image.src} className={isWide(index, count) ? "col-span-2" : "col-span-2 md:col-span-1"}>
            <figure>
              <button
                type="button"
                aria-label={`${labels.open}: ${image.alt}`}
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setCurrent(index);
                }}
                className="group block w-full cursor-zoom-in overflow-hidden rounded-xl md:rounded-2xl"
              >
                <ImageReveal
                  src={image.src}
                  alt={image.alt}
                  sizes={isWide(index, count) ? "(min-width: 1760px) 1700px, 96vw" : "(min-width: 768px) 48vw, 96vw"}
                  quality={85}
                  className="w-full"
                  style={{ aspectRatio: `${image.width} / ${image.height}` }}
                  imageClassName="object-cover transition-transform duration-[1.2s] ease-[var(--ease-expo)] group-hover:scale-[1.02]"
                />
              </button>
              {image.caption && <figcaption className="mt-3 text-sm text-soft/75">{image.caption}</figcaption>}
            </figure>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={labels.label}
        onClose={() => {
          setCurrent(null);
          openerRef.current?.focus();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(isRtl ? -1 : 1);
          if (event.key === "ArrowLeft") step(isRtl ? 1 : -1);
        }}
        data-lenis-prevent
        className="m-0 size-full max-h-none max-w-none bg-ink/95 p-0 text-soft backdrop:bg-ink/90"
      >
        {current !== null && (
          <div className="relative flex size-full flex-col">
            <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
              <p className="text-sm tabular-nums text-soft/80" aria-live="polite">
                {current + 1} {labels.of} {count}
              </p>
              <button
                type="button"
                onClick={() => setCurrent(null)}
                aria-label={labels.close}
                className="grid size-11 place-items-center rounded-full bg-soft/10 text-xl transition-colors hover:bg-lime hover:text-ink"
              >
                <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="relative min-h-0 flex-1 px-4 md:px-20">
              <div className="relative size-full">
                <Image key={images[current].src} src={images[current].src} alt={images[current].alt} fill sizes="100vw" quality={90} className="object-contain" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 py-4">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={labels.prev}
                className="grid size-12 place-items-center rounded-full bg-soft/10 text-lg transition-colors hover:bg-lime hover:text-ink"
              >
                <Arrow className="rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={labels.next}
                className="grid size-12 place-items-center rounded-full bg-soft/10 text-lg transition-colors hover:bg-lime hover:text-ink"
              >
                <Arrow />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
