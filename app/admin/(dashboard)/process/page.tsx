import type { Metadata } from "next";
import { CollectionManager } from "@/components/admin/CollectionManager";
import { SectionForm } from "@/components/admin/SectionForm";
import { PageHeader } from "@/components/admin/ui";
import { loadCollectionRows, loadSectionForm, requireAdmin } from "@/lib/cms/admin-data";

export const metadata: Metadata = { title: "Work process" };

export default async function ProcessAdminPage() {
  const { supabase } = await requireAdmin();
  const [section, rows] = await Promise.all([loadSectionForm(supabase, "process"), loadCollectionRows(supabase, "process_steps")]);

  return (
    <>
      <PageHeader title="Work process" description="The steps you take clients through, in order." />
      <div className="flex flex-col gap-4">
        <CollectionManager collection="process_steps" rows={rows} />
        <SectionForm sectionKey="process" values={section.values} visible={section.visible} />
      </div>
    </>
  );
}
