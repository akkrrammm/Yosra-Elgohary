import type { Metadata } from "next";
import { ProjectEditor } from "@/components/admin/projects/ProjectEditor";
import { PageHeader } from "@/components/admin/ui";
import { categoryOptions, emptyProject, requireAdmin } from "@/lib/cms/admin-data";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  const { supabase } = await requireAdmin();
  const categories = await categoryOptions(supabase);

  return (
    <>
      <PageHeader title="New project" description="It stays private until you publish it." />
      <ProjectEditor projectId={null} initial={emptyProject(categories)} categories={categories} />
    </>
  );
}
