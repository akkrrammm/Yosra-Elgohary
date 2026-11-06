import type { Metadata } from "next";
import Link from "next/link";
import { SeoPageForm, SettingsForm } from "@/components/admin/SectionForm";
import { Card, PageHeader } from "@/components/admin/ui";
import { loadSettingsForm, requireAdmin, seoFormValues } from "@/lib/cms/admin-data";
import { SEO_PAGES } from "@/lib/cms/definitions";
import type { FormValues } from "@/lib/cms/fields";

export const metadata: Metadata = { title: "SEO" };

export default async function SeoAdminPage() {
  const { supabase } = await requireAdmin();

  const [defaults, { data: rows, error }, { data: projects, error: projectsError }] = await Promise.all([
    loadSettingsForm(supabase, "seo"),
    supabase.from("seo_metadata").select("*").not("page_key", "is", null),
    supabase.from("projects").select("id, title, status").order("display_order"),
  ]);
  if (error) throw new Error(error.message);
  if (projectsError) throw new Error(projectsError.message);

  const pages = await Promise.all(
    SEO_PAGES.map(async (page) => ({
      ...page,
      values: await seoFormValues(supabase, rows?.find((row) => row.page_key === page.key) as unknown as FormValues | undefined),
    })),
  );

  return (
    <>
      <PageHeader title="SEO" description="How the website appears on Google and when it is shared. The sitemap updates by itself and only ever lists published projects." />
      <div className="flex flex-col gap-4">
        <SettingsForm group="seo" values={defaults} />
        {pages.map((page) => (
          <SeoPageForm key={page.key} pageKey={page.key} title={page.label} description={`Search and sharing details for ${page.path ? page.path : "the homepage"}.`} values={page.values} />
        ))}
        <Card title="Projects" description="Each project has its own search and sharing details at the bottom of its page.">
          <ul className="grid gap-1 sm:grid-cols-2">
            {(projects ?? []).map((project) => (
              <li key={project.id} className="min-w-0">
                <Link href={`/admin/projects/${project.id}`} className="block truncate rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-soft hover:text-brand">
                  {project.title.en ?? project.title.ar ?? "Untitled"}
                  {project.status === "draft" && " (draft)"}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
