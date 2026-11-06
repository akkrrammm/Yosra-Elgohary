import Link from "next/link";
import { lang } from "next/root-params";
import { Arrow } from "@/components/ui/Arrow";
import { getSite } from "@/lib/cms/site";
import { defaultLocale, hasLocale } from "@/lib/i18n";

export default async function NotFound() {
  const current = await lang();
  const locale = current && hasLocale(current) ? current : defaultLocale;
  const site = await getSite(locale);
  const copy = site.notFound;

  return (
    <section className="flex min-h-[80svh] flex-col justify-center bg-ink px-[var(--gutter)] pt-28 text-soft">
      <p aria-hidden className="display text-[clamp(6rem,24vw,22rem)] leading-none text-pop">
        404
      </p>
      <h1 className="display mt-4 text-[clamp(2rem,5vw,5rem)]">{copy.title}</h1>
      <p className="mt-4 max-w-lg text-lg text-soft/80">{copy.text}</p>
      <Link
        href={`/${locale}`}
        className="mt-8 inline-flex w-fit items-center gap-3 rounded-full bg-lime px-7 py-4 font-semibold text-ink transition-colors hover:bg-soft"
      >
        {copy.back}
        <Arrow />
      </Link>
    </section>
  );
}
