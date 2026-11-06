"use client";

import { AnimatePresence, m, useMotionValueEvent, useScroll } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLenis } from "@/components/providers/Providers";
import { AnchorLink } from "@/components/ui/AnchorLink";
import { Arrow } from "@/components/ui/Arrow";
import type { CmsImage, LinkItem } from "@/lib/cms/types";
import { localizeHref, type Locale } from "@/lib/i18n";
import { LanguageSwitch } from "./LanguageSwitch";

type Labels = { menu: string; close: string; home: string; main: string };

type Props = {
  lang: Locale;
  name: string;
  logo: CmsImage | null;
  items: LinkItem[];
  ctaLabel: string;
  ctaHref: string;
  labels: Labels;
  showLanguageSwitch: boolean;
};

export function Nav({ lang, name, logo, items, ctaLabel, ctaHref, labels, showLanguageSwitch }: Props) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const pathname = usePathname();
  const lenis = useLenis();
  const home = `/${lang}`;
  const sectionIds = items.flatMap((item) => (item.href.startsWith("#") ? [item.href.slice(1)] : [])).join(",");
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(current > previous && current > 240);
  });

  // Highlight the section currently in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActiveSection(entry.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of sectionIds.split(",")) {
      const element = id ? document.getElementById(id) : null;
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [pathname, sectionIds]);

  // The open menu takes over the page: stop scrolling, close on Escape, keep focus inside.
  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    const toggle = toggleRef.current;
    menuRef.current?.querySelector("a")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab" || !menuRef.current) return;
      const items = [...menuRef.current.querySelectorAll<HTMLElement>("a"), toggle].filter(Boolean) as HTMLElement[];
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
      document.documentElement.style.overflow = "";
      toggle?.focus({ preventScroll: true });
    };
  }, [open, lenis]);

  const links = items.map((item) => ({
    id: item.href.startsWith("#") ? item.href.slice(1) : item.href,
    href: localizeHref(item.href, lang),
    label: item.label,
  }));
  const cta = ctaLabel && ctaHref ? { label: ctaLabel, href: localizeHref(ctaHref, lang) } : null;

  return (
    <>
      <m.header
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] px-3 pt-3 md:px-5 md:pt-4"
        initial={false}
        animate={{ y: hidden && !open ? "-130%" : "0%" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onFocusCapture={() => setHidden(false)}
      >
        <div className="pointer-events-auto mx-auto flex max-w-[1760px] items-center justify-between gap-3 rounded-full bg-ink/85 py-2 pe-2 ps-3 text-soft ring-1 ring-soft/10 backdrop-blur-xl">
          <Link href={home} aria-label={labels.home} className="flex items-center gap-2.5 rounded-full">
            {logo && <Image src={logo.src} alt="" width={61} height={64} className="h-8 w-auto" />}
            <span dir="ltr" className="latin text-lg font-semibold tracking-tight">
              {name}
            </span>
          </Link>

          <nav aria-label={labels.main} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {links.map((link) => (
                <li key={link.id}>
                  <AnchorLink
                    href={link.href}
                    aria-current={activeSection === link.id ? "true" : undefined}
                    className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-soft/10 aria-[current=true]:text-lime"
                  >
                    {link.label}
                  </AnchorLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5">
            {showLanguageSwitch && (
              <LanguageSwitch
                lang={lang}
                className="hidden rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-soft/10 sm:block"
              />
            )}
            {cta && (
              <AnchorLink
                href={cta.href}
                className="group hidden items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-soft lg:inline-flex"
              >
                {cta.label}
                <Arrow className="transition-transform duration-300 group-hover:translate-x-[calc(var(--dir)*3px)]" />
              </AnchorLink>
            )}
            <button
              ref={toggleRef}
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? labels.close : labels.menu}
              onClick={() => setOpen((value) => !value)}
              className="grid size-11 place-items-center rounded-full bg-soft/10 lg:hidden"
            >
              <span aria-hidden className="relative block h-3 w-5">
                <span
                  className={`absolute inset-x-0 h-0.5 rounded-full bg-current transition-all duration-300 ${open ? "top-[5px] rotate-45" : "top-0"}`}
                />
                <span
                  className={`absolute inset-x-0 h-0.5 rounded-full bg-current transition-all duration-300 ${open ? "top-[5px] -rotate-45" : "top-[10px]"}`}
                />
              </span>
            </button>
          </div>
        </div>
      </m.header>

      <AnimatePresence>
        {open && (
          <m.div
            ref={menuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={labels.main}
            className="fixed inset-0 z-[65] flex flex-col justify-between overflow-y-auto bg-brand px-[var(--gutter)] pb-10 pt-28 text-soft lg:hidden"
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul className="flex flex-col gap-2">
              {links.map((link, index) => (
                <m.li
                  key={link.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  <AnchorLink
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="display block py-1 text-[clamp(2.75rem,13vw,5rem)]"
                  >
                    {link.label}
                  </AnchorLink>
                </m.li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              {showLanguageSwitch && <LanguageSwitch lang={lang} className="rounded-full bg-soft/15 px-5 py-3 font-medium" />}
              {cta && (
                <AnchorLink
                  href={cta.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 font-semibold text-ink"
                >
                  {cta.label}
                  <Arrow />
                </AnchorLink>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
