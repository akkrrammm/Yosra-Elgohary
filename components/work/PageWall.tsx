"use client";

import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Reveal } from "@/components/ui/Reveal";
import type { WallPage } from "@/lib/cms/types";
import type { Locale } from "@/lib/i18n";

type Props = { lang: Locale; title: string; rows: WallPage[][] };

/** Two rows of real pages sliding in opposite directions as the page scrolls. */
export function PageWall({ lang, title, rows }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const forward = useTransform(scrollYProgress, [0, 1], ["-4%", "-24%"]);
  const backward = useTransform(scrollYProgress, [0, 1], ["-24%", "-4%"]);

  return (
    <div ref={ref} className="mt-24 overflow-clip md:mt-36">
      <Reveal className="mx-auto max-w-[1760px] px-[var(--gutter)]">
        <h3 className="display text-[clamp(2.25rem,5.5vw,5.5rem)]">{title}</h3>
      </Reveal>

      <div dir="ltr" className={`mt-10 flex flex-col gap-4 md:gap-6 ${reduced ? "overflow-x-auto" : ""}`}>
        {rows.map((row, rowIndex) => (
          <m.ul
            key={rowIndex}
            className="flex w-max gap-4 md:gap-6"
            style={{ x: reduced ? 0 : rowIndex % 2 === 0 ? forward : backward }}
          >
            {row.map((page) => (
              <li key={page.src} className="h-[44vw] shrink-0 md:h-[27vw] lg:h-[21vw]">
                <Link
                  href={`/${lang}/work/${page.slug}`}
                  aria-label={page.alt}
                  className="group relative block h-full overflow-hidden rounded-xl"
                  style={{ aspectRatio: `${page.width} / ${page.height}` }}
                >
                  <Image
                    src={page.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 32vw, (min-width: 768px) 42vw, 72vw"
                    quality={75}
                    className="object-cover transition-transform duration-700 ease-[var(--ease-expo)] group-hover:scale-105"
                  />
                </Link>
              </li>
            ))}
          </m.ul>
        ))}
      </div>
    </div>
  );
}
