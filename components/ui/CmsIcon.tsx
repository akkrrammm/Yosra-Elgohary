import { CMS_ICONS } from "@/lib/cms/icons";

/** Renders an icon chosen in the CMS. Renders nothing when none was chosen. */
export function CmsIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  const Icon = name ? CMS_ICONS[name]?.icon : undefined;
  return Icon ? <Icon aria-hidden className={className} /> : null;
}
