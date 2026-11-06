import { formatProjectCount, type Locale } from "@/lib/i18n";
import type { ResolvedProject } from "./types";

/** What the homepage needs from a project. Galleries and case studies stay on the project pages. */
export const toProjectTiles = (projects: ResolvedProject[]): ResolvedProject[] =>
  projects.map((project) => ({
    ...project,
    gallery: [],
    tools: [],
    deliverables: undefined,
    caseStudy: { highlights: [], palette: [] },
  }));

/** Functions cannot cross into client components, so the screen reader announcements are prepared here. */
export function workResultCounts(projects: ResolvedProject[], categories: { id: string }[], lang: Locale) {
  const counts: Record<string, string> = { all: formatProjectCount(projects.length, lang) };
  for (const { id } of categories) {
    counts[id] = formatProjectCount(projects.filter((project) => project.categoryId === id).length, lang);
  }
  return counts;
}
