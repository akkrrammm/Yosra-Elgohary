import { CircleCheck, FolderKanban, Image as ImageIcon, Languages, Plus, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/admin/ui";
import { loadOverview, requireAdmin } from "@/lib/cms/admin-data";

export const metadata: Metadata = { title: "Overview" };

function StatTile({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/5 transition hover:ring-2 hover:ring-brand">
      <span className="block text-sm text-ink/70">{label}</span>
      <span className="mt-1 block font-sans text-4xl font-semibold tabular-nums tracking-tight">{value.toLocaleString("en")}</span>
    </Link>
  );
}

export default async function OverviewPage() {
  const { supabase, displayName } = await requireAdmin();
  const { stats, toDo, translationGaps, totalMissingArabic } = await loadOverview(supabase);

  return (
    <>
      <PageHeader
        title={displayName ? `Welcome back, ${displayName}` : "Welcome back"}
        description="What is on the website right now, and what still needs you."
        actions={
          <Link href="/admin/projects/new" className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink">
            <Plus aria-hidden className="size-4" />
            Add project
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Projects live" value={stats.published} href="/admin/projects" />
        <StatTile label="Private drafts" value={stats.drafts} href="/admin/projects" />
        <StatTile label="Services showing" value={stats.services} href="/admin/services" />
        <StatTile label="Files in the library" value={stats.files} href="/admin/media" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Needs your attention">
          {toDo.length === 0 ? (
            <p className="flex items-center gap-2 text-sm">
              <CircleCheck aria-hidden className="size-4 text-brand" />
              Nothing right now. Everything is filled in.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {toDo.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="flex items-start gap-2.5 rounded-lg p-2 text-sm hover:bg-soft">
                    <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Missing Arabic text" description={totalMissingArabic === 0 ? undefined : "The Arabic website shows the English text in these places until you add a translation."}>
          {translationGaps.length === 0 ? (
            <p className="flex items-center gap-2 text-sm">
              <CircleCheck aria-hidden className="size-4 text-brand" />
              Everything has an Arabic version.
            </p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
              {translationGaps.map((gap) => (
                <li key={`${gap.href}:${gap.label}`}>
                  <Link href={gap.href} className="flex items-center justify-between gap-3 rounded-lg p-2 text-sm hover:bg-soft">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Languages aria-hidden className="size-4 shrink-0 text-brand" />
                      <span className="truncate">{gap.label}</span>
                    </span>
                    <span className="shrink-0 text-ink/65">
                      {gap.count} {gap.count === 1 ? "field" : "fields"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link href="/admin/projects" className="flex items-center gap-3 rounded-2xl bg-ink p-5 font-semibold text-white transition-colors hover:bg-brand">
          <FolderKanban aria-hidden className="size-5 text-lime" />
          Manage your projects
        </Link>
        <Link href="/admin/media" className="flex items-center gap-3 rounded-2xl bg-ink p-5 font-semibold text-white transition-colors hover:bg-brand">
          <ImageIcon aria-hidden className="size-5 text-lime" />
          Open the media library
        </Link>
      </div>
    </>
  );
}
