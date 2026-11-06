import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Contact } from "@/components/sections/Contact";
import { Services } from "@/components/sections/Services";
import { buildMetadata } from "@/lib/cms/metadata";
import { getSeo, getSite, keepToAvailableLanguage } from "@/lib/cms/site";
import { hasLocale } from "@/lib/i18n";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const [site, seo] = await Promise.all([getSite(lang), getSeo({ page: "services" }, lang)]);
  return buildMetadata(site, seo, { path: "/services", fallbackTitle: site.services.title, fallbackDescription: site.settings.jobTitle });
}

/** The Services section on its own address, so it can have its own search listing and share preview. */
export default async function ServicesPage({ params }: Params) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const site = await getSite(lang);
  keepToAvailableLanguage(site, "/services");
  if (!site.services.visible || site.services.items.length === 0) notFound();

  return (
    <>
      <Services lang={lang} data={site.services} under="bg-ink" />
      {site.contact.visible && <Contact site={site} under="bg-brand" />}
    </>
  );
}
