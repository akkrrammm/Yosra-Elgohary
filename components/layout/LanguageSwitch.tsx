"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

/** Links to the same page in the other language, labeled in that language. */
export function LanguageSwitch({ lang, className }: { lang: Locale; className?: string }) {
  const pathname = usePathname();
  const other: Locale = lang === "en" ? "ar" : "en";
  const href = pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${other}`);

  return (
    <Link href={href} lang={other} hrefLang={other} className={className}>
      {other === "ar" ? "العربية" : "English"}
    </Link>
  );
}
