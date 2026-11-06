"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Arrow, PlayGlyph } from "@/components/ui/Arrow";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import { TitleText } from "@/components/ui/TitleText";
import { splitTitle } from "@/lib/cms/titles";
import type { ResolvedProject } from "@/lib/cms/types";
import type { Locale } from "@/lib/i18n";
import type { ProjectTile as TileStyle } from "@/lib/supabase/database.types";

/** Grid placement, frame and image sizes for each tile style. */
const LAYOUT: Record<Exclude<TileStyle, "deck" | "row">, { cell: string; frame: string; sizes: string; fan?: CSSProperties }> = {
  wide: {
    cell: "col-span-12 lg:col-span-8",
    frame: "fan aspect-[4/3]",
    sizes: "(min-width: 1024px) 64vw, 100vw",
    fan: { "--fan-x": "26%", "--fan-y": "38%" } as CSSProperties,
  },
  narrow: {
    cell: "col-span-12 lg:col-span-4 lg:mt-56",
    frame: "fan aspect-[3/4]",
    sizes: "(min-width: 1024px) 32vw, 100vw",
    fan: { "--fan-x": "60%", "--fan-y": "38%" } as CSSProperties,
  },
  large: {
    cell: "col-span-12 lg:col-span-7",
    frame: "aspect-[7/5] rounded-[clamp(1rem,2vw,2rem)]",
    sizes: "(min-width: 1024px) 56vw, 100vw",
  },
  medium: {
    cell: "col-span-12 lg:col-span-5 lg:mt-40",
    frame: "aspect-[3/2] rounded-[clamp(1rem,2vw,2rem)]",
    sizes: "(min-width: 1024px) 40vw, 100vw",
  },
};

type Props = {
  project: ResolvedProject;
  lang: Locale;
  number: number;
  viewLabel: string;
  openLabel: string;
  videoLabel: string;
  featuredLabel: string;
};

export function ProjectTile({ project, lang, number, viewLabel, openLabel, videoLabel, featuredLabel }: Props) {
  const layout = LAYOUT[project.tile as keyof typeof LAYOUT];
  const { main, sub } = splitTitle(project.title);

  return (
    <article className={layout.cell}>
      <Link href={`/${lang}/work/${project.slug}`} data-cursor={viewLabel} className="group block rounded-3xl">
        <div className="relative">
          <ImageReveal
            src={project.coverImage.src}
            alt={project.coverImage.alt}
            sizes={layout.sizes}
            className={`${layout.frame} bg-soft/5`}
            style={layout.fan}
            imageClassName="object-cover transition-transform duration-[1.4s] ease-[var(--ease-expo)] group-hover:scale-[1.04]"
          />
          {project.video && (
            <span className="absolute end-4 top-4 inline-flex items-center gap-2 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-medium text-soft backdrop-blur">
              <PlayGlyph className="text-lime" />
              {videoLabel}
            </span>
          )}
        </div>

        <Reveal className="mt-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-soft/75">
            <span aria-hidden className="tabular-nums text-lime">
              {String(number).padStart(2, "0")}
            </span>
            {project.categoryLabel && <span>{project.categoryLabel}</span>}
            {project.client && (
              <>
                <span aria-hidden className="text-soft/30">
                  /
                </span>
                <bdi>{project.client}</bdi>
              </>
            )}
            {project.featured && (
              <span className="rounded-full bg-lime px-2.5 py-0.5 text-xs font-semibold text-ink">{featuredLabel}</span>
            )}
          </div>
          <h3 className="display mt-3 flex items-start justify-between gap-4 text-[clamp(1.75rem,3.2vw,3.5rem)]">
            <TitleText text={project.title} className="min-w-0">
              {main}
              {sub && <span className="accent mt-1 block text-[0.8em] text-pop">{sub}</span>}
            </TitleText>
            <span className="mt-1 hidden shrink-0 items-center gap-2 text-base font-medium tracking-normal sm:inline-flex lg:hidden">
              {openLabel}
              <Arrow />
            </span>
          </h3>
        </Reveal>
      </Link>
    </article>
  );
}
