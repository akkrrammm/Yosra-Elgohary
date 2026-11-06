import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { buildMetadata } from "@/lib/cms/metadata";
import { getSeo, getSite, keepToAvailableLanguage } from "@/lib/cms/site";
import { hasLocale } from "@/lib/i18n";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const [site, seo] = await Promise.all([getSite(lang), getSeo({ page: "about" }, lang)]);
  return buildMetadata(site, seo, { path: "/about", fallbackTitle: site.about.label, fallbackDescription: site.about.statement });
}

/** The About section on its own address, so it can have its own search listing and share preview. */
export default async function AboutPage({ params }: Params) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const site = await getSite(lang);
  keepToAvailableLanguage(site, "/about");
  if (!site.about.visible) notFound();

  return (
    <>
      <About data={site.about} />
      {site.contact.visible && <Contact site={site} under="bg-soft" />}
    </>
  );
}
