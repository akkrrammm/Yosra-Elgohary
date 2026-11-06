import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Contact } from "@/components/sections/Contact";
import { Work } from "@/components/sections/Work";
import { buildMetadata } from "@/lib/cms/metadata";
import { getSeo, getSite, keepToAvailableLanguage } from "@/lib/cms/site";
import { toProjectTiles, workResultCounts } from "@/lib/cms/tiles";
import { hasLocale } from "@/lib/i18n";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const [site, seo] = await Promise.all([getSite(lang), getSeo({ page: "projects" }, lang)]);
  return buildMetadata(site, seo, {
    path: "/work",
    fallbackTitle: `${site.work.titleA} ${site.work.titleB}`,
    fallbackDescription: site.work.lead,
  });
}

/** Selected Work on its own address, so it can have its own search listing and share preview. */
export default async function WorkPage({ params }: Params) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const site = await getSite(lang);
  keepToAvailableLanguage(site, "/work");
  if (!site.work.visible) notFound();
  const tiles = toProjectTiles(site.projects);

  return (
    <>
      <Work lang={lang} data={site.work} projects={tiles} resultCounts={workResultCounts(tiles, site.work.categories, lang)} under="bg-ink" />
      {site.contact.visible && <Contact site={site} under="bg-ink" />}
    </>
  );
}
