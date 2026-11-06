import type { Metadata } from "next";
import { CollectionManager } from "@/components/admin/CollectionManager";
import { SectionForm } from "@/components/admin/SectionForm";
import { PageHeader } from "@/components/admin/ui";
import { loadCollectionRows, loadSectionForm, requireAdmin } from "@/lib/cms/admin-data";

export const metadata: Metadata = { title: "Results & achievements" };

export default async function AchievementsAdminPage() {
  const { supabase } = await requireAdmin();
  const [section, rows] = await Promise.all([loadSectionForm(supabase, "achievements"), loadCollectionRows(supabase, "achievements")]);

  return (
    <>
      <PageHeader title="Results & achievements" description="Real numbers only. Every figure here should be one you can back up if a client asks." />
      <div className="flex flex-col gap-4">
        <CollectionManager collection="achievements" rows={rows} />
        <SectionForm sectionKey="achievements" values={section.values} visible={section.visible} />
      </div>
    </>
  );
}
