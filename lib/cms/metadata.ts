import "server-only";
import type { Metadata } from "next";
import { ogLocaleOf, type Locale } from "@/lib/i18n";
import type { SiteData } from "./types";

/**
 * The public address, for canonical links, the sitemap and share previews. A localhost address
 * copied into a host's settings must never reach search engines, so on Vercel the project's
 * own production address takes over from one, or from no address at all.
 */
function resolveSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const usable = configured && !/\/\/(localhost|127\.0\.0\.1)\b/.test(configured);
  if (usable) return configured;
  return production ? `https://${production}` : (configured ?? "http://localhost:3000");
}

export const siteUrl = resolveSiteUrl().replace(/\/$/, "");

type SeoValues = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: { url: string; width: number; height: number } | null;
  twitterTitle: string;
  twitterDescription: string;
  twitterCard: "summary" | "summary_large_image";
  canonicalUrl: string | null;
  noindex: boolean;
};

/**
 * Turns an SEO record into page metadata. `path` comes after the language, for
 * example "/work/my-project", or "" for the homepage.
 */
export function buildMetadata(
  site: SiteData,
  seo: SeoValues,
  options: {
    path: string;
    fallbackTitle: string;
    fallbackDescription: string;
    /** The homepage title is used as written, without the site name added after it. */
    absoluteTitle?: boolean;
    type?: "website" | "article";
    fallbackImage?: { url: string; width: number; height: number } | null;
  },
): Metadata {
  const lang: Locale = site.lang;
  const title = seo.title || options.fallbackTitle;
  const description = seo.description || options.fallbackDescription;
  const ogTitle = seo.ogTitle || title;
  const ogDescription = seo.ogDescription || description;
  const defaultOg = site.logos.defaultOg
    ? { url: site.logos.defaultOg.src, width: site.logos.defaultOg.width, height: site.logos.defaultOg.height }
    : null;
  const image = seo.ogImage ?? options.fallbackImage ?? defaultOg;

  const languages = Object.fromEntries(site.availableLocales.map((locale) => [locale, `/${locale}${options.path}`]));

  return {
    title: options.absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: seo.canonicalUrl ?? `/${lang}${options.path}`,
      languages: { ...languages, "x-default": `/${site.defaultLocale}${options.path}` },
    },
    robots: site.settings.allowIndexing && !seo.noindex ? undefined : { index: false, follow: false },
    openGraph: {
      type: options.type ?? "website",
      siteName: site.settings.name,
      title: ogTitle,
      description: ogDescription,
      url: `/${lang}${options.path}`,
      locale: ogLocaleOf(lang),
      images: image ? [{ ...image, alt: ogTitle }] : undefined,
    },
    twitter: {
      card: seo.twitterCard,
      title: seo.twitterTitle || ogTitle,
      description: seo.twitterDescription || ogDescription,
      images: image ? [image.url] : undefined,
    },
  };
}
