"use client";

import { Video } from "lucide-react";
import Image from "next/image";
import type { MediaItem } from "@/lib/cms/fields";

/** A small preview of a library file, on a pattern so transparent logos can be seen. */
export function MediaThumb({ item, sizes = "160px", className = "" }: { item: MediaItem; sizes?: string; className?: string }) {
  if (item.kind === "video") {
    return (
      <div className={`relative grid place-items-center bg-ink text-white ${className}`}>
        <Video aria-hidden className="size-6" />
        <span className="absolute inset-x-1 bottom-1 truncate text-center text-[10px]">{item.original_name}</span>
      </div>
    );
  }
  return (
    <div className={`checkerboard relative overflow-hidden ${className}`}>
      <Image src={item.url} alt={item.alt.en ?? ""} fill sizes={sizes} quality={75} className="object-contain" />
    </div>
  );
}
