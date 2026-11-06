import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/cms/metadata";
import { getPublishedSnapshot } from "@/lib/cms/snapshot";

export const revalidate = 3600;

/** Built from what is actually published: drafts and anything marked "hide from search" stay out. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const snapshot = await getPublishedSnapshot();
  const { settings, sections, seo, projects, services } = snapshot;
  if (settings && !settings.allow_indexing) return [];

  const locales = settings?.available_locales ?? ["en", "ar"];
  const sectionVisible = (key: string) => sections.find((section) => section.key === key)?.visible === true;
  const pageHidden = (key: string) => seo.some((row) => row.page_key === key && row.noindex);
  const projectHidden = (id: string) => seo.some((row) => row.project_id === id && row.noindex);

  const pages: { path: string; lastModified?: string }[] = [];
  if (!pageHidden("home")) pages.push({ path: "" });
  if (sectionVisible("about") && !pageHidden("about")) pages.push({ path: "/about" });
  // With no service showing, this address is a "not found" page, so it must not be listed.
  if (sectionVisible("services") && services.some((service) => service.visible) && !pageHidden("services")) pages.push({ path: "/services" });
  if (sectionVisible("work") && !pageHidden("projects")) pages.push({ path: "/work" });

  for (const project of projects) {
    if (project.status === "published" && !projectHidden(project.id)) {
      pages.push({ path: `/work/${project.slug}`, lastModified: project.updated_at });
    }
  }

  return pages.flatMap(({ path, lastModified }) =>
    locales.map((lang) => ({
      url: `${siteUrl}/${lang}${path}`,
      lastModified,
      alternates: {
        languages: Object.fromEntries(locales.map((locale) => [locale, `${siteUrl}/${locale}${path}`])),
      },
    })),
  );
}
