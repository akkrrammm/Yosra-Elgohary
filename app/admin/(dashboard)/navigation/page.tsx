import type { Metadata } from "next";
import { CollectionManager } from "@/components/admin/CollectionManager";
import { SectionForm } from "@/components/admin/SectionForm";
import { PageHeader } from "@/components/admin/ui";
import { loadCollectionRows, loadSectionForm, requireAdmin } from "@/lib/cms/admin-data";

export const metadata: Metadata = { title: "Navigation & footer" };

export default async function NavigationAdminPage() {
  const { supabase } = await requireAdmin();
  const [header, footer, navigation, footerText] = await Promise.all([
    loadCollectionRows(supabase, "nav_header"),
    loadCollectionRows(supabase, "nav_footer"),
    loadSectionForm(supabase, "navigation"),
    loadSectionForm(supabase, "footer"),
  ]);

  return (
    <>
      <PageHeader title="Navigation & footer" description="The links at the top and bottom of every page. A link to a hidden section hides along with it." />
      <div className="flex flex-col gap-4">
        <CollectionManager collection="nav_header" rows={header} title="Top bar links" />
        <SectionForm sectionKey="navigation" values={navigation.values} visible={navigation.visible} />
        <CollectionManager collection="nav_footer" rows={footer} title="Footer links" />
        <SectionForm sectionKey="footer" values={footerText.values} visible={footerText.visible} />
      </div>
    </>
  );
}
