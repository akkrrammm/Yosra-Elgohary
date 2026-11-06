import type { Metadata } from "next";
import { CollectionManager } from "@/components/admin/CollectionManager";
import { SectionForm } from "@/components/admin/SectionForm";
import { PageHeader } from "@/components/admin/ui";
import { loadCollectionRows, loadProjectOptions, loadSectionForm, requireAdmin } from "@/lib/cms/admin-data";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesAdminPage() {
  const { supabase } = await requireAdmin();
  const [section, rows, projects] = await Promise.all([loadSectionForm(supabase, "services"), loadCollectionRows(supabase, "services"), loadProjectOptions(supabase)]);

  return (
    <>
      <PageHeader title="Services" description="What you offer. Drag or use the arrows to change the order." />
      <div className="flex flex-col gap-4">
        <CollectionManager collection="services" rows={rows} context={{ projects }} />
        <SectionForm sectionKey="services" values={section.values} visible={section.visible} />
      </div>
    </>
  );
}
