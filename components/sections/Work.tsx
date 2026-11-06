"use client";

import { m } from "motion/react";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { DeckTile } from "@/components/work/DeckTile";
import { PageWall } from "@/components/work/PageWall";
import { Playlist } from "@/components/work/Playlist";
import { ProjectTile } from "@/components/work/ProjectTile";
import type { ResolvedProject, SiteData } from "@/lib/cms/types";
import type { Locale } from "@/lib/i18n";

type Props = {
  lang: Locale;
  data: SiteData["work"];
  projects: ResolvedProject[];
  /** Announced to screen readers when the filter changes. */
  resultCounts: Record<string, string>;
  under?: string;
};

export function Work({ lang, data, projects, resultCounts, under = "bg-brand" }: Props) {
  const [filter, setFilter] = useState("all");

  const visible = projects.filter((project) => filter === "all" || project.categoryId === filter);
  const tiles = visible.filter((project) => project.tile !== "row");
  const rows = visible.filter((project) => project.tile === "row");
  const filters = [{ id: "all", label: data.allLabel }, ...data.categories];
  const hasWall = data.showWall && data.wall.some((row) => row.length > 0);

  return (
    <Sheet id="work" under={under} labelledBy="work-title" className="bg-ink pb-24 pt-28 text-soft md:pt-44">
      <div className="mx-auto max-w-[1760px] px-[var(--gutter)]">
        <header className="grid grid-cols-12 items-end gap-x-6 gap-y-8">
          <h2 id="work-title" className="display col-span-12 text-[clamp(4rem,14vw,15rem)] leading-[0.85] rtl:leading-[1.1] lg:col-span-8">
            {data.titleA} <span className="accent text-pop">{data.titleB}</span>
          </h2>
          <p className="col-span-12 max-w-md text-lg leading-relaxed text-soft/80 lg:col-span-4 lg:justify-self-end">
            {data.lead}
          </p>
        </header>

        <div role="group" aria-label={data.filterLabel} className="mt-12 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
              className="rounded-full px-5 py-2.5 text-sm font-medium ring-1 ring-soft/25 transition-colors hover:bg-soft/10 aria-pressed:bg-soft aria-pressed:text-ink aria-pressed:ring-soft"
            >
              {item.label}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="sr-only">
          {resultCounts[filter]}
        </p>

        {/* Re-keying replays the reveals when the filter changes */}
        <m.div key={filter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          {tiles.length > 0 && (
            <div className="mt-16 grid grid-cols-12 gap-x-6 gap-y-20 md:mt-24 md:gap-y-32">
              {tiles.map((project) =>
                project.tile === "deck" ? (
                  <DeckTile key={project.slug} project={project} lang={lang} viewLabel={data.viewLabel} openLabel={data.openLabel} featuredLabel={data.featuredLabel} number={projects.indexOf(project) + 1} />
                ) : (
                  <ProjectTile key={project.slug} project={project} lang={lang} viewLabel={data.viewLabel} openLabel={data.openLabel} videoLabel={data.videoLabel} featuredLabel={data.featuredLabel} number={projects.indexOf(project) + 1} />
                ),
              )}
            </div>
          )}

          {rows.length > 0 && (
            <Playlist lang={lang} title={data.playlistTitle} projects={rows} numberOf={(project) => projects.indexOf(project) + 1} />
          )}
        </m.div>
      </div>

      {hasWall && <PageWall lang={lang} title={data.wallTitle} rows={data.wall} />}
    </Sheet>
  );
}
