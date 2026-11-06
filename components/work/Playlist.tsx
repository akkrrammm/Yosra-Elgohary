"use client";

import { AnimatePresence, m, useMotionValue, useSpring } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PlayGlyph } from "@/components/ui/Arrow";
import { Reveal } from "@/components/ui/Reveal";
import { TitleText } from "@/components/ui/TitleText";
import { splitTitle } from "@/lib/cms/titles";
import type { ResolvedProject } from "@/lib/cms/types";
import type { Locale } from "@/lib/i18n";

type Props = {
  lang: Locale;
  title: string;
  projects: ResolvedProject[];
  numberOf: (project: ResolvedProject) => number;
};

/** Filmed work as a typographic playlist, with its cover floating beside the pointer. */
export function Playlist({ lang, title, projects, numberOf }: Props) {
  const [active, setActive] = useState<ResolvedProject | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, { stiffness: 220, damping: 28, mass: 0.6 });
  const smoothY = useSpring(y, { stiffness: 220, damping: 28, mass: 0.6 });

  return (
    <section aria-labelledby="playlist-title" className="mt-24 md:mt-36">
      <Reveal>
        <h3 id="playlist-title" className="display text-[clamp(2.25rem,5.5vw,5.5rem)]">
          {title}
        </h3>
      </Reveal>

      <ul
        className="mt-10"
        onMouseMove={(event) => {
          const rtl = document.documentElement.dir === "rtl";
          x.set(rtl ? Math.max(event.clientX, 340) : Math.min(event.clientX, window.innerWidth - 340));
          y.set(Math.min(Math.max(event.clientY, 110), window.innerHeight - 140));
        }}
        onMouseLeave={() => setActive(null)}
      >
        {projects.map((project) => {
          const { main, sub } = splitTitle(project.title);
          return (
            <li key={project.slug} className="border-t border-soft/15 last:border-b">
              <Link
                href={`/${lang}/work/${project.slug}`}
                onMouseEnter={() => setActive(project)}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 py-5 transition-[padding] duration-500 ease-[var(--ease-expo)] hover:lg:ps-6 md:gap-x-8 md:py-7"
              >
                <span
                  className="relative aspect-[4/3] w-16 overflow-hidden rounded-lg lg:hidden"
                  style={{ background: project.coverBackground }}
                >
                  <Image src={project.coverImage.src} alt="" fill sizes="64px" className="object-contain" />
                </span>
                <span aria-hidden className="hidden w-8 text-sm tabular-nums text-lime lg:block">
                  {String(numberOf(project)).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <TitleText text={project.title} className="display block text-[clamp(1.25rem,3.2vw,3.25rem)] transition-colors duration-300 group-hover:text-lime">
                    {main}
                    {sub && (
                      <span className="text-soft/60 transition-colors group-hover:text-lime"> {sub}</span>
                    )}
                  </TitleText>
                  <span className="mt-1.5 block text-sm text-soft/75">
                    {project.client && <bdi>{project.client}</bdi>}
                    {project.client && project.role && " · "}
                    {project.role?.join(lang === "ar" ? " و" : " & ")}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="grid size-11 place-items-center rounded-full text-lg ring-1 ring-soft/25 transition-colors group-hover:bg-lime group-hover:text-ink group-hover:ring-lime md:size-14"
                >
                  <PlayGlyph />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Floating cover. Pointer devices only: touch screens get the inline thumbnail. */}
      <m.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-50 hidden lg:block"
        style={{ x: smoothX, y: smoothY }}
      >
        <AnimatePresence>
          {active && (
            <m.div
              key={active.slug}
              className="absolute -top-24 start-8 aspect-[4/3] w-72 overflow-hidden rounded-2xl shadow-2xl"
              style={{ background: active.coverBackground }}
              initial={{ opacity: 0, scale: 0.85, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image src={active.coverImage.src} alt="" fill sizes="288px" className="object-contain" />
            </m.div>
          )}
        </AnimatePresence>
      </m.div>
    </section>
  );
}
