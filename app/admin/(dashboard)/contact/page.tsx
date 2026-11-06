import type { Metadata } from "next";
import Link from "next/link";
import { SectionForm, SettingsForm } from "@/components/admin/SectionForm";
import { PageHeader } from "@/components/admin/ui";
import { loadSectionForm, loadSettingsForm, requireAdmin } from "@/lib/cms/admin-data";

export const metadata: Metadata = { title: "Contact information" };

export default async function ContactAdminPage() {
  const { supabase } = await requireAdmin();
  const [details, section] = await Promise.all([loadSettingsForm(supabase, "contact"), loadSectionForm(supabase, "contact")]);

  return (
    <>
      <PageHeader
        title="Contact information"
        description="How clients reach you."
        actions={
          <Link href="/admin/social" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold ring-1 ring-ink/15 transition-colors hover:bg-soft">
            Social media links
          </Link>
        }
      />
      <div className="flex flex-col gap-4">
        <SettingsForm group="contact" values={details} />
        <SectionForm sectionKey="contact" values={section.values} visible={section.visible} />
      </div>
    </>
  );
}
