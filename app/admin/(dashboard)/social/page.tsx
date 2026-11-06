import type { Metadata } from "next";
import { CollectionManager } from "@/components/admin/CollectionManager";
import { PageHeader } from "@/components/admin/ui";
import { loadCollectionRows, requireAdmin } from "@/lib/cms/admin-data";

export const metadata: Metadata = { title: "Social media links" };

export default async function SocialAdminPage() {
  const { supabase } = await requireAdmin();
  const rows = await loadCollectionRows(supabase, "social_links");

  return (
    <>
      <PageHeader title="Social media links" description="Shown in the Contact section and the footer." />
      <CollectionManager collection="social_links" rows={rows} />
    </>
  );
}
