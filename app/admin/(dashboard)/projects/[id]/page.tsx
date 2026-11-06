import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ProjectEditor } from "@/components/admin/projects/ProjectEditor";
import { PageHeader } from "@/components/admin/ui";
import { categoryOptions, loadProjectForm, requireAdmin } from "@/lib/cms/admin-data";
import type { LocalizedText } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "Edit project" };

type Props = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase } = await requireAdmin();
  const [project, categories] = await Promise.all([loadProjectForm(supabase, id), categoryOptions(supabase)]);
  if (!project) notFound();

  const title = project.values.title as LocalizedText;

  return (
    <>
      <PageHeader title={title.en ?? title.ar ?? "Edit project"} />
      <ProjectEditor key={id} projectId={id} initial={project} categories={categories} />
    </>
  );
}
