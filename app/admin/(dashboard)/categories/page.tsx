import type { Metadata } from "next";
import { CollectionManager } from "@/components/admin/CollectionManager";
import { PageHeader } from "@/components/admin/ui";
import { loadCollectionRows, requireAdmin } from "@/lib/cms/admin-data";

export const metadata: Metadata = { title: "Project categories" };

export default async function CategoriesAdminPage() {
  const { supabase } = await requireAdmin();
  const rows = await loadCollectionRows(supabase, "project_categories");

  return (
    <>
      <PageHeader title="Project categories" description="The filter buttons above the projects on the homepage. A category with no published projects is not shown." />
      <CollectionManager collection="project_categories" rows={rows} />
    </>
  );
}
