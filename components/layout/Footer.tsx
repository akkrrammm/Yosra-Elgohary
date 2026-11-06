import Image from "next/image";
import { AnchorLink } from "@/components/ui/AnchorLink";
import { Arrow } from "@/components/ui/Arrow";
import type { SiteData } from "@/lib/cms/types";
import { localizeHref } from "@/lib/i18n";
import { LanguageSwitch } from "./LanguageSwitch";

export function Footer({ site }: { site: SiteData }) {
  const { lang, footer, navigation, logos, settings, availableLocales } = site;

  return (
    <footer className="bg-ink px-[var(--gutter)] pb-8 pt-16 text-soft">
      <div className="mx-auto flex max-w-[1760px] flex-col gap-12 border-t border-soft/15 pt-12 md:flex-row md:items-end md:justify-between">
        {logos.lockup && (
          <Image src={logos.lockup.src} alt={footer.logoAlt} width={146} height={208} className="h-52 w-auto self-start md:self-end" />
        )}
        <nav aria-label={navigation.labels.footer}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            {navigation.footer.map((link) => (
              <li key={link.href}>
                <AnchorLink href={localizeHref(link.href, lang)} className="transition-colors hover:text-lime">
                  {link.label}
                </AnchorLink>
              </li>
            ))}
            {availableLocales.length > 1 && (
              <li>
                <LanguageSwitch lang={lang} className="transition-colors hover:text-lime" />
              </li>
            )}
          </ul>
        </nav>
      </div>
      <div className="mx-auto mt-10 flex max-w-[1760px] flex-wrap items-center justify-between gap-4 text-sm text-soft/70">
        <p>
          © {new Date().getFullYear()} <bdi>{settings.name}</bdi>. {footer.rights}
        </p>
        <AnchorLink href={`/${lang}#top`} className="inline-flex items-center gap-2 transition-colors hover:text-lime">
          {footer.topLabel}
          <Arrow className="-rotate-90" />
        </AnchorLink>
      </div>
    </footer>
  );
}
