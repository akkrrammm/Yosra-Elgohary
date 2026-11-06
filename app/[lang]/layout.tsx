import type { Metadata, Viewport } from "next";
import {
  Alexandria,
  Bricolage_Grotesque,
  Fraunces,
  IBM_Plex_Sans_Arabic,
  Instrument_Sans,
} from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../globals.css";
import { CursorLabel } from "@/components/layout/CursorLabel";
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { PreviewBanner } from "@/components/layout/PreviewBanner";
import { Providers } from "@/components/providers/Providers";
import { siteUrl } from "@/lib/cms/metadata";
import { getSeo, getSite } from "@/lib/cms/site";
import { dirOf, hasLocale, locales } from "@/lib/i18n";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  weight: "variable",
});
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  style: "italic",
  variable: "--font-fraunces",
  display: "swap",
  weight: "variable",
  preload: false,
});
const alexandria = Alexandria({
  subsets: ["arabic"],
  variable: "--font-alexandria",
  display: "swap",
  weight: "variable",
  preload: false,
});
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-plex-arabic",
  display: "swap",
  weight: ["400", "500", "600"],
  preload: false,
});

type Params = { params: Promise<{ lang: string }> };

export const generateStaticParams = () => locales.map((lang) => ({ lang }));

export const viewport: Viewport = { themeColor: "#17151F" };

/** Defaults for every page. Each page adds its own title, description and share preview. */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const [site, seo] = await Promise.all([getSite(lang), getSeo({ page: "home" }, lang)]);

  return {
    metadataBase: new URL(siteUrl),
    title: { default: seo.title || site.settings.name, template: site.settings.titleTemplate },
    description: seo.description,
    authors: [{ name: site.settings.name }],
    icons: { icon: site.logos.favicon ?? "/brand/icon.png" },
  };
}

/** Sets the flag that skips the loader for the rest of the session, before first paint. */
const SEEN_SCRIPT = `try{if(sessionStorage.getItem("ye-seen"))document.documentElement.setAttribute("data-seen","");else sessionStorage.setItem("ye-seen","1")}catch(e){}`;

export default async function RootLayout({ children, params }: Params & { children: ReactNode }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const site = await getSite(lang);

  const { settings, logos, navigation, socials } = site;

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: settings.name,
    alternateName: settings.fullName,
    jobTitle: settings.jobTitle,
    url: `${siteUrl}/${lang}`,
    image: logos.defaultProfile ? new URL(logos.defaultProfile.src, siteUrl).toString() : undefined,
    address: settings.addressLocality
      ? { "@type": "PostalAddress", addressLocality: settings.addressLocality, addressCountry: settings.addressCountry }
      : undefined,
    sameAs: socials.map((social) => social.href),
  };

  return (
    <html
      lang={lang}
      dir={dirOf(lang)}
      suppressHydrationWarning
      className={`${bricolage.variable} ${instrument.variable} ${fraunces.variable} ${alexandria.variable} ${plexArabic.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SEEN_SCRIPT }} />
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;clip-path:none!important;transform:none!important}`}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, "\\u003c") }}
        />
      </head>
      <body>
        <a
          href="#main"
          className="fixed start-4 top-4 z-[100] -translate-y-24 rounded-full bg-lime px-5 py-3 font-semibold text-ink transition-transform focus:translate-y-0"
        >
          {navigation.labels.skip}
        </a>
        <Providers>
          <Nav
            lang={lang}
            name={settings.name}
            logo={logos.mark}
            items={navigation.header}
            ctaLabel={navigation.ctaLabel}
            ctaHref={navigation.ctaHref}
            labels={navigation.labels}
            showLanguageSwitch={site.availableLocales.length > 1}
          />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer site={site} />
          <CursorLabel />
          {site.isPreview && <PreviewBanner exitPath={`/${lang}`} />}
        </Providers>
      </body>
    </html>
  );
}
