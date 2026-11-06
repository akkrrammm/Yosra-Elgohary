"use client";

import { m } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Arrow } from "@/components/ui/Arrow";
import { TitleText } from "@/components/ui/TitleText";
import type { ResolvedProject } from "@/lib/cms/types";
import type { Locale } from "@/lib/i18n";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Stacked at rest, fanned out in view, spread further on hover. The last one sits on top, in the center. */
const SPREAD = [
  {
    hidden: { rotate: 0, x: "0%", y: "0%" },
    visible: { rotate: -8, x: "-19%", y: "4%" },
    hover: { rotate: -11, x: "-27%", y: "5%" },
  },
  {
    hidden: { rotate: 0, x: "0%", y: "0%" },
    visible: { rotate: 8, x: "19%", y: "4%" },
    hover: { rotate: 11, x: "27%", y: "5%" },
  },
  {
    hidden: { rotate: 0, x: "0%", y: "0%", scale: 1 },
    visible: { rotate: 0, x: "0%", y: "-2%", scale: 1 },
    hover: { rotate: 0, x: "0%", y: "-5%", scale: 1.03 },
  },
];

type Props = {
  project: ResolvedProject;
  lang: Locale;
  number: number;
  viewLabel: string;
  openLabel: string;
  featuredLabel: string;
};

/** A brand guidelines deck shown as what it is: a hand of pages. */
export function DeckTile({ project, lang, number, viewLabel, openLabel, featuredLabel }: Props) {
  const pages = project.deck.slice(0, 3);
  const firstSpread = SPREAD.length - pages.length;

  return (
    <article className="on-light col-span-12 text-ink">
      <Link
        href={`/${lang}/work/${project.slug}`}
        data-cursor={viewLabel}
        className="group block rounded-[clamp(1.5rem,4vw,4rem)]"
      >
        <m.div
          className="sheet grid grid-cols-12 items-center gap-x-6 gap-y-10 overflow-hidden bg-soft px-6 py-14 md:px-12 md:py-20"
          style={{ "--sheet-radius": "clamp(3.5rem, 12vw, 13rem)", borderEndEndRadius: "clamp(1.5rem,4vw,4rem)" } as React.CSSProperties}
          initial="hidden"
          whileInView="visible"
          whileHover="hover"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="col-span-12 lg:col-span-5">
            <div className="flex flex-wrap items-center gap-3 text-sm text-ink/75">
              <span aria-hidden className="font-semibold tabular-nums text-brand">
                {String(number).padStart(2, "0")}
              </span>
              {project.categoryLabel && <span>{project.categoryLabel}</span>}
              {project.featured && (
                <span className="rounded-full bg-lime px-2.5 py-0.5 text-xs font-semibold text-ink">{featuredLabel}</span>
              )}
            </div>
            <h3 className="display mt-4 text-[clamp(2rem,4vw,4.25rem)]">
              <TitleText text={project.title}>{project.title}</TitleText>
            </h3>
            <p className="mt-5 max-w-md leading-relaxed text-ink/80">{project.description}</p>
            <span className="mt-7 inline-flex items-center gap-2 font-semibold text-brand lg:hidden">
              {openLabel}
              <Arrow />
            </span>
          </div>

          <div className="relative col-span-12 mx-auto aspect-[16/10] w-full max-w-4xl lg:col-span-7">
            {pages.map((page, index) => (
              <m.div
                key={page.src}
                className="absolute inset-x-[14%] top-[12%] aspect-[16/9] overflow-hidden rounded-lg shadow-[0_30px_60px_-20px_rgb(23_21_31/0.55)] md:rounded-xl"
                variants={SPREAD[firstSpread + index]}
                transition={{ duration: 1.1, ease: EASE }}
                style={{ zIndex: index }}
              >
                <Image src={page.src} alt={page.alt} fill sizes="(min-width: 1024px) 40vw, 72vw" quality={85} className="object-cover" />
              </m.div>
            ))}
          </div>
        </m.div>
      </Link>
    </article>
  );
}
