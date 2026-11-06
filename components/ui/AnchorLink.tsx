"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { useLenis } from "@/components/providers/Providers";
import { isExternalHref } from "@/lib/i18n";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/**
 * A link typed into the CMS. Sections on the same page glide into view, other pages
 * navigate normally, and outside addresses open in a new tab.
 */
export function AnchorLink({ href, onClick, ...props }: Props) {
  const lenis = useLenis();
  const pathname = usePathname();

  if (isExternalHref(href)) {
    const opensNewTab = href.startsWith("http");
    return (
      <a
        href={href}
        target={opensNewTab ? "_blank" : undefined}
        rel={opensNewTab ? "noopener noreferrer" : undefined}
        onClick={onClick}
        className={props.className}
        aria-label={props["aria-label"]}
      >
        {props.children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        const [path, hash] = href.split("#");
        if (!hash || path !== pathname) return;
        const target = document.getElementById(hash);
        if (!target) return;
        event.preventDefault();
        // Next frame: closing the mobile menu restarts Lenis, which would cancel a scroll begun now.
        requestAnimationFrame(() => {
          if (lenis) lenis.scrollTo(target);
          else target.scrollIntoView();
        });
        window.history.replaceState(null, "", href);
        target.focus({ preventScroll: true });
      }}
      {...props}
    />
  );
}
