import type { Metadata } from "next";
import { HomepageLayout } from "@/components/admin/HomepageLayout";
import { SectionForm } from "@/components/admin/SectionForm";
import { PageHeader } from "@/components/admin/ui";
import { loadSectionForm, requireAdmin } from "@/lib/cms/admin-data";
import { HOMEPAGE_ORDERED } from "@/lib/cms/definitions";

export const metadata: Metadata = { title: "Homepage" };

export default async function HomepageAdminPage() {
  const { supabase } = await requireAdmin();

  const [hero, ribbon, work, { data: rows, error }] = await Promise.all([
    loadSectionForm(supabase, "hero"),
    loadSectionForm(supabase, "ribbon"),
    loadSectionForm(supabase, "work"),
    supabase.from("site_sections").select("key, visible, display_order").order("display_order"),
  ]);
  if (error) throw new Error(error.message);

  const details = new Map<string, { key: string; label: string; href: string }>(HOMEPAGE_ORDERED.map((section) => [section.key, section]));
  const sections = (rows ?? []).flatMap((row) => {
    const section = details.get(row.key);
    return section ? [{ ...section, visible: row.visible }] : [];
  });

  return (
    <>
      <PageHeader title="Homepage" description="The hero, the moving ribbon, the Selected Work text and the order of everything else." />
      <div className="flex flex-col gap-4">
        <HomepageLayout sections={sections} />
        <SectionForm sectionKey="hero" values={hero.values} visible={hero.visible} />
        <SectionForm sectionKey="ribbon" values={ribbon.values} visible={ribbon.visible} />
        <SectionForm sectionKey="work" values={work.values} visible={work.visible} />
      </div>
    </>
  );
}
