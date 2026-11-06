import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudy } from "@/components/work/CaseStudy";
import { buildMetadata } from "@/lib/cms/metadata";
import { getSeo, getSite, keepToAvailableLanguage } from "@/lib/cms/site";
import { getPublishedSnapshot } from "@/lib/cms/snapshot";
import { hasLocale, locales } from "@/lib/i18n";

type Params = { params: Promise<{ lang: string; slug: string }> };

export async function generateStaticParams() {
  const { projects } = await getPublishedSnapshot();
  return locales.flatMap((lang) =>
    projects.filter((project) => project.status === "published").map((project) => ({ lang, slug: project.slug })),
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const site = await getSite(lang);
  const project = site.projects.find((item) => item.slug === slug);
  if (!project) return {};

  const seo = await getSeo({ projectId: project.id }, lang);
  const cover = project.coverImage;

  return buildMetadata(site, seo, {
    path: `/work/${slug}`,
    fallbackTitle: project.title,
    fallbackDescription: project.description,
    type: "article",
    fallbackImage: { url: cover.src, width: cover.width, height: cover.height },
  });
}

export default async function ProjectPage({ params }: Params) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();

  const site = await getSite(lang);
  keepToAvailableLanguage(site, `/work/${slug}`);
  const index = site.projects.findIndex((item) => item.slug === slug);
  if (index < 0) notFound();

  const project = site.projects[index];
  const next = site.projects[(index + 1) % site.projects.length];

  return <CaseStudy project={project} next={next} lang={lang} labels={site.projectLabels} />;
}
