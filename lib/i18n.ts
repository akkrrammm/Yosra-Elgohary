export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** A value written once per language. */
export type Localized<T = string> = Record<Locale, T>;

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const dirOf = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");

export const ogLocaleOf = (locale: Locale) => (locale === "ar" ? "ar_EG" : "en_US");

/** Links typed into the CMS may be "#about", "/work/x" or a full address. This adds the language where needed. */
export function localizeHref(href: string, locale: Locale) {
  if (href.startsWith("#")) return `/${locale}${href}`;
  if (href.startsWith("/") && !/^\/(en|ar)(\/|#|$)/.test(href)) return `/${locale}${href === "/" ? "" : href}`;
  return href;
}

export const isExternalHref = (href: string) => /^(https?:|mailto:|tel:)/.test(href);

/** True when text is written in Arabic, so it gets Arabic type settings instead of Latin ones. */
export const hasArabic = (text: string) => /[؀-ۿ]/.test(text);

export function formatProjectCount(count: number, locale: Locale) {
  if (locale === "en") return `${count} ${count === 1 ? "project" : "projects"}`;
  if (count === 1) return "مشروع واحد";
  if (count === 2) return "مشروعان";
  return count <= 10 ? `${count} مشروعات` : `${count} مشروعًا`;
}
