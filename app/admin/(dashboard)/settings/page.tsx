import type { Metadata } from "next";
import { SectionForm, SettingsForm } from "@/components/admin/SectionForm";
import { PageHeader } from "@/components/admin/ui";
import { loadSectionForm, loadSettingsForm, requireAdmin } from "@/lib/cms/admin-data";

export const metadata: Metadata = { title: "Website settings" };

export default async function SettingsAdminPage() {
  const { supabase } = await requireAdmin();
  const [brand, images, languages, labels] = await Promise.all([
    loadSettingsForm(supabase, "brand"),
    loadSettingsForm(supabase, "images"),
    loadSettingsForm(supabase, "languages"),
    loadSectionForm(supabase, "labels"),
  ]);

  return (
    <>
      <PageHeader title="Website settings" description="Your name, logos and languages, used across the whole website." />
      <div className="flex flex-col gap-4">
        <SettingsForm group="brand" values={brand} />
        <SettingsForm group="images" values={images} />
        <SettingsForm group="languages" values={languages} />
        <SectionForm sectionKey="labels" values={labels.values} visible={labels.visible} />
      </div>
    </>
  );
}
