import type { ReactNode } from "react";
import { hasArabic } from "@/lib/i18n";

/**
 * Wraps a project title. Latin titles on Arabic pages go in <bdi>, which gives them
 * Latin type settings. A title written in Arabic stays with the page's Arabic settings.
 */
export function TitleText({ text, className, children }: { text: string; className?: string; children: ReactNode }) {
  if (hasArabic(text)) return <span className={className}>{children}</span>;
  return <bdi className={className}>{children}</bdi>;
}
