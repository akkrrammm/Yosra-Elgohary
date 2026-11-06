import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Loader } from "@/components/layout/Loader";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Counted } from "@/components/sections/Counted";
import { Hero } from "@/components/sections/Hero";
import { Process } from "@/components/sections/Process";
import { Services } from "@/components/sections/Services";
import { Work } from "@/components/sections/Work";
import { Ribbon } from "@/components/ui/Ribbon";
import { buildMetadata } from "@/lib/cms/metadata";
import { getSeo, getSite, keepToAvailableLanguage } from "@/lib/cms/site";
import { toProjectTiles, workResultCounts } from "@/lib/cms/tiles";
import type { HomepageSection } from "@/lib/cms/types";
import { hasLocale } from "@/lib/i18n";

type Params = { params: Promise<{ lang: string }> };

/** Each section's background, so the next one's curved corner shows the right color behind it. */
const SECTION_BACKGROUND: Record<HomepageSection, string> = {
  about: "bg-soft",
  services: "bg-brand",
  work: "bg-ink",
  process: "bg-soft",
  achievements: "bg-pop",
  contact: "bg-ink",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const [site, seo] = await Promise.all([getSite(lang), getSeo({ page: "home" }, lang)]);

  return buildMetadata(site, seo, {
    path: "",
    fallbackTitle: site.settings.name,
    fallbackDescription: site.settings.jobTitle,
    absoluteTitle: true,
  });
}

export default async function HomePage({ params }: Params) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const site = await getSite(lang);
  keepToAvailableLanguage(site);
  const tiles = toProjectTiles(site.projects);

  const sections: Record<HomepageSection, (under: string) => React.ReactNode> = {
    about: (under) => <About data={site.about} under={under} />,
    services: (under) => (site.services.items.length > 0 ? <Services lang={lang} data={site.services} under={under} /> : null),
    work: (under) => (
      <Work lang={lang} data={site.work} projects={tiles} resultCounts={workResultCounts(tiles, site.work.categories, lang)} under={under} />
    ),
    process: (under) => (site.process.steps.length > 0 ? <Process data={site.process} under={under} /> : null),
    achievements: (under) => (site.achievements.items.length > 0 ? <Counted data={site.achievements} under={under} /> : null),
    contact: (under) => <Contact site={site} under={under} />,
  };

  return (
    <>
      <Loader logo={site.logos.mark} />
      {site.hero.visible && <Hero site={site} />}
      {site.ribbon.visible && site.ribbon.items.length > 0 && <Ribbon items={site.ribbon.items} />}
      {site.homepageOrder.map((key, index) => {
        const previous = site.homepageOrder[index - 1];
        return <div key={key}>{sections[key](previous ? SECTION_BACKGROUND[previous] : "bg-ink")}</div>;
      })}
    </>
  );
}
