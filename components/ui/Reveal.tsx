"use client";

import { m } from "motion/react";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

/** Fades and lifts its content the first time it scrolls into view. */
export function Reveal({ children, className, delay = 0, y = 28 }: RevealProps) {
  return (
    <m.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </m.div>
  );
}

type ImageRevealProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  style?: CSSProperties;
  quality?: number;
};

/**
 * An image wiping open from its center as it enters the view.
 * Pass the frame through className and style (aspect ratio, corners). The image fills it.
 */
export function ImageReveal({ src, alt, sizes, className, imageClassName, style, quality = 85 }: ImageRevealProps) {
  return (
    <m.div
      data-reveal
      className={`relative overflow-hidden ${className ?? ""}`}
      style={style}
      initial={{ clipPath: "inset(10% 0% 10% 0%)", opacity: 0 }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 1.2, ease: EASE }}
    >
      <m.div
        data-reveal
        className="absolute inset-0"
        initial={{ scale: 1.12 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 1.6, ease: EASE }}
      >
        <Image src={src} alt={alt} fill sizes={sizes} quality={quality} className={imageClassName ?? "object-cover"} />
      </m.div>
    </m.div>
  );
}
