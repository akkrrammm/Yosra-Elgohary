"use client";

import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  /** How far the image drifts, as a percentage of its own height. */
  distance?: number;
  preload?: boolean;
  quality?: number;
  objectPosition?: string;
};

/** An image that drifts slowly inside its frame while the page scrolls. */
export function ParallaxImage({ src, alt, sizes, distance = 8, preload, quality = 85, objectPosition }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${-distance}%`, `${distance}%`]);
  const bleed = reduced ? "0%" : `${-distance}%`;

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <m.div className="absolute inset-x-0" style={{ y: reduced ? 0 : y, top: bleed, bottom: bleed }}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          quality={quality}
          className="object-cover"
          style={objectPosition ? { objectPosition } : undefined}
        />
      </m.div>
    </div>
  );
}
