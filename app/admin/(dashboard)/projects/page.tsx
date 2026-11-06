import type { Metadata } from "next";
import { ProjectsTable } from "@/components/admin/projects/ProjectsTable";
import { PageHeader } from "@/components/admin/ui";
import { loadProjectList, requireAdmin } from "@/lib/cms/admin-data";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsAdminPage() {
  const { supabase } = await requireAdmin();
  const { projects, categories } = await loadProjectList(supabase);

  return (
    <>
      <PageHeader title="Projects" description="Your portfolio. Published projects appear on the website in this order, straight away." />
      <ProjectsTable projects={projects} categories={categories} />
    </>
  );
}
