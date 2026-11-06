import type { Metadata } from "next";
import { SectionForm } from "@/components/admin/SectionForm";
import { PageHeader } from "@/components/admin/ui";
import { loadSectionForm, requireAdmin } from "@/lib/cms/admin-data";

export const metadata: Metadata = { title: "About me" };

export default async function AboutAdminPage() {
  const { supabase } = await requireAdmin();
  const about = await loadSectionForm(supabase, "about");

  return (
    <>
      <PageHeader title="About me" description="Your story, how you think and the key facts visitors should know. This appears on the homepage and the About page." />
      <SectionForm sectionKey="about" values={about.values} visible={about.visible} />
    </>
  );
}
