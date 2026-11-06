import "server-only";
import { redirect } from "next/navigation";
import { type AdminClient, getAdminContext } from "./admin";
import type { ProjectInput } from "./actions/projects";
import { COLLECTIONS, type CollectionKey, PROJECT_FIELDSETS, SECTIONS, SEO_FIELDSETS, type SectionKey, SETTINGS_GROUPS, type SettingsGroupKey } from "./definitions";
import { emptyValues, flattenFields, type FieldDef, type FormValues, type MediaItem, missingArabic } from "./fields";
import { loadMediaItems } from "./media-records";
import { fetchSnapshot } from "./snapshot";

/** For dashboard pages. Sends anyone who is not an administrator away. */
export async function requireAdmin() {
  const context = await getAdminContext();
  if (context.status !== "ok") redirect("/admin/login");
  return context;
}

/** A section's stored content in the shape its form expects, with its images ready to preview. */
export async function loadSectionForm(supabase: AdminClient, key: SectionKey) {
  const [{ data: row, error }, { data: media, error: mediaError }] = await Promise.all([
    supabase.from("site_sections").select("*").eq("key", key).maybeSingle(),
    supabase.from("section_media").select("*").eq("section_key", key).order("position"),
  ]);
  if (error) throw new Error(error.message);
  if (mediaError) throw new Error(mediaError.message);

  const items = await loadMediaItems(supabase, (media ?? []).map((item) => item.media_id));
  const fields = flattenFields(SECTIONS[key].fieldsets);
  const values: FormValues = { ...emptyValues(fields), ...(row?.content ?? {}) };

  for (const field of fields) {
    if (field.type !== "media") continue;
    const chosen = (media ?? [])
      .filter((item) => item.slot === field.key)
      .flatMap((item) => items.get(item.media_id) ?? []);
    values[field.key] = field.multiple ? chosen : (chosen[0] ?? null);
  }

  return { values, visible: row?.visible ?? true };
}

/** Swaps stored file ids for the files themselves, so the form can show previews. */
function withMedia(fields: FieldDef[], row: FormValues, items: Map<string, MediaItem>) {
  const values: FormValues = { ...emptyValues(fields), ...row };
  for (const field of fields) {
    if (field.type === "media") {
      const id = row[field.key];
      values[field.key] = typeof id === "string" ? (items.get(id) ?? null) : null;
    } else if (values[field.key] === null) {
      values[field.key] = "";
    }
  }
  return values;
}

export async function loadCollectionRows(supabase: AdminClient, key: CollectionKey) {
  const definition = COLLECTIONS[key];
  let query = supabase
    .from(definition.table as "services")
    .select("*")
    .order("display_order");
  if ("fixed" in definition) query = query.eq("location" as never, definition.fixed.location as never);
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as (FormValues & { id: string; visible?: boolean })[];
  const mediaFields = definition.fields.filter((field) => field.type === "media");
  const items = await loadMediaItems(supabase, rows.flatMap((row) => mediaFields.map((field) => row[field.key] as string | null)));

  let proof = new Map<string, string[]>();
  if (key === "services") {
    const { data: links, error: linkError } = await supabase.from("service_projects").select("*").order("display_order");
    if (linkError) throw new Error(linkError.message);
    proof = (links ?? []).reduce((map, link) => map.set(link.service_id, [...(map.get(link.service_id) ?? []), link.project_id]), new Map<string, string[]>());
  }

  return rows.map((row) => ({
    ...withMedia(definition.fields, row, items),
    id: row.id,
    visible: row.visible,
    ...(key === "services" ? { proof: proof.get(row.id) ?? [] } : {}),
  }));
}

export async function loadSettingsForm(supabase: AdminClient, group: SettingsGroupKey) {
  const { data: row, error } = await supabase.from("site_settings").select("*").maybeSingle();
  if (error) throw new Error(error.message);

  const fields = flattenFields(SETTINGS_GROUPS[group].fieldsets);
  const mediaIds = fields.filter((field) => field.type === "media").map((field) => (row as unknown as FormValues | null)?.[field.key] as string | null);
  const items = await loadMediaItems(supabase, mediaIds);
  return withMedia(fields, (row ?? {}) as unknown as FormValues, items);
}

export const seoFields = flattenFields(SEO_FIELDSETS);

/** Stored SEO values in the shape the SEO form expects. */
export async function seoFormValues(supabase: AdminClient, row: FormValues | null | undefined) {
  const items = await loadMediaItems(supabase, [row?.og_media_id as string | null]);
  return withMedia(seoFields, row ?? {}, items);
}

export async function loadProjectOptions(supabase: AdminClient) {
  const { data, error } = await supabase.from("projects").select("id, title, status").order("display_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map((project) => ({
    id: project.id,
    title: `${project.title.en ?? project.title.ar ?? "Untitled"}${project.status === "draft" ? " (draft)" : ""}`,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Projects                                                                  */
/* -------------------------------------------------------------------------- */

const projectName = (title: { en?: string; ar?: string }) => title.en ?? title.ar ?? "Untitled";

export async function categoryOptions(supabase: AdminClient) {
  const { data, error } = await supabase.from("project_categories").select("id, name").order("display_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map((category) => ({ value: category.id, label: category.name.en ?? category.name.ar ?? "Untitled" }));
}

export async function loadProjectList(supabase: AdminClient) {
  const [{ data: projects, error }, categories] = await Promise.all([supabase.from("projects").select("*").order("display_order"), categoryOptions(supabase)]);
  if (error) throw new Error(error.message);

  const covers = await loadMediaItems(supabase, (projects ?? []).map((project) => project.cover_media_id));
  const categoryNames = new Map(categories.map((category) => [category.value, category.label]));

  return {
    categories: categories.map((category) => ({ id: category.value, name: category.label })),
    projects: (projects ?? []).map((project) => ({
      id: project.id,
      title: projectName(project.title),
      slug: project.slug,
      client: project.client ?? "",
      status: project.status,
      featured: project.featured,
      categoryId: project.category_id,
      categoryName: project.category_id ? (categoryNames.get(project.category_id) ?? null) : null,
      cover: project.cover_media_id ? (covers.get(project.cover_media_id) ?? null) : null,
    })),
  };
}

export function emptyProject(categories: { value: string; label: string }[]): ProjectInput {
  const fields = flattenFields(Object.values(PROJECT_FIELDSETS(categories)));
  return {
    values: { ...emptyValues(fields), tile: "medium" },
    seo: emptyValues(seoFields),
    gallery: [],
    status: "draft",
  };
}

export async function loadProjectForm(supabase: AdminClient, id: string): Promise<ProjectInput | null> {
  const [{ data: project, error }, { data: gallery, error: galleryError }, { data: seo, error: seoError }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("project_gallery").select("*").eq("project_id", id).order("display_order"),
    supabase.from("seo_metadata").select("*").eq("project_id", id).maybeSingle(),
  ]);
  if (error) throw new Error(error.message);
  if (galleryError) throw new Error(galleryError.message);
  if (seoError) throw new Error(seoError.message);
  if (!project) return null;

  const items = await loadMediaItems(supabase, [project.cover_media_id, project.video_media_id, seo?.og_media_id, ...(gallery ?? []).map((item) => item.media_id)]);
  const fields = flattenFields(Object.values(PROJECT_FIELDSETS([])));

  return {
    values: withMedia(fields, project as unknown as FormValues, items),
    seo: withMedia(seoFields, (seo ?? {}) as unknown as FormValues, items),
    gallery: (gallery ?? []).flatMap((item) => {
      const media = items.get(item.media_id);
      return media ? [{ media, caption: item.caption, deck_position: item.deck_position }] : [];
    }),
    status: project.status,
  };
}

export async function loadWall(supabase: AdminClient) {
  const [{ data: gallery, error }, { data: wall, error: wallError }, { data: projects, error: projectsError }] = await Promise.all([
    supabase.from("project_gallery").select("*").order("display_order"),
    supabase.from("wall_items").select("*").order("display_order"),
    supabase.from("projects").select("id, title, status, display_order").order("display_order"),
  ]);
  if (error) throw new Error(error.message);
  if (wallError) throw new Error(wallError.message);
  if (projectsError) throw new Error(projectsError.message);

  const items = await loadMediaItems(supabase, (gallery ?? []).map((item) => item.media_id));

  const candidates = (projects ?? []).flatMap((project) =>
    (gallery ?? [])
      .filter((item) => item.project_id === project.id)
      .flatMap((item) => {
        const media = items.get(item.media_id);
        return media ? [{ id: item.id, media, projectTitle: projectName(project.title), published: project.status === "published" }] : [];
      }),
  );

  const entries = (wall ?? [])
    .toSorted((a, b) => a.row_index - b.row_index || a.display_order - b.display_order)
    .map((item) => ({ id: item.gallery_item_id, row: (item.row_index === 1 ? 1 : 0) as 0 | 1 }));

  return { candidates, entries };
}

/* -------------------------------------------------------------------------- */
/*  Overview                                                                  */
/* -------------------------------------------------------------------------- */

const SECTION_PAGES: Partial<Record<SectionKey, string>> = {
  about: "/admin/about",
  services: "/admin/services",
  process: "/admin/process",
  achievements: "/admin/achievements",
  contact: "/admin/contact",
  navigation: "/admin/navigation",
  footer: "/admin/navigation",
  labels: "/admin/settings",
};

export async function loadOverview(supabase: AdminClient) {
  const snapshot = await fetchSnapshot(supabase);

  const published = snapshot.projects.filter((project) => project.status === "published");
  const drafts = snapshot.projects.filter((project) => project.status === "draft");

  const toDo: { label: string; href: string }[] = [];
  const settings = snapshot.settings;
  if (!settings) toDo.push({ label: "The original content has not been moved in yet, so the website is still showing its built-in copy. Run npm run cms:seed.", href: "/admin" });
  if (settings && !settings.allow_indexing) toDo.push({ label: "Search engines are blocked from listing the website.", href: "/admin/seo" });
  if (settings && !settings.contact_email) toDo.push({ label: "Add your email so clients can reach you.", href: "/admin/contact" });
  if (settings && !settings.contact_phone) toDo.push({ label: "Add your phone number, or leave it empty to keep it hidden.", href: "/admin/contact" });
  if (settings && !settings.contact_whatsapp) toDo.push({ label: "Add your WhatsApp number, or leave it empty to keep it hidden.", href: "/admin/contact" });
  for (const project of drafts) toDo.push({ label: `“${projectName(project.title)}” is still a private draft.`, href: `/admin/projects/${project.id}` });

  const translationGaps: { label: string; href: string; count: number }[] = [];
  const addGap = (label: string, href: string, count: number) => {
    if (count > 0) translationGaps.push({ label, href, count });
  };

  for (const section of snapshot.sections) {
    const definition = SECTIONS[section.key as SectionKey];
    if (!definition) continue;
    const label = SECTION_PAGES[section.key as SectionKey] ? definition.title : `Homepage: ${definition.title}`;
    addGap(label, SECTION_PAGES[section.key as SectionKey] ?? "/admin/homepage", missingArabic(flattenFields(definition.fieldsets), section.content).length);
  }

  const collectionGaps = [
    ["services", snapshot.services, "/admin/services", "Services"],
    ["process_steps", snapshot.steps, "/admin/process", "Work process"],
    ["achievements", snapshot.achievements, "/admin/achievements", "Results & achievements"],
    ["project_categories", snapshot.categories, "/admin/categories", "Project categories"],
  ] as const;
  for (const [key, rows, href, label] of collectionGaps) {
    const fields = COLLECTIONS[key].fields;
    addGap(label, href, rows.reduce((total, row) => total + missingArabic(fields, row as unknown as FormValues).length, 0));
  }
  addGap(
    "Navigation & footer",
    "/admin/navigation",
    snapshot.navigation.reduce((total, row) => total + missingArabic(COLLECTIONS.nav_header.fields, row as unknown as FormValues).length, 0),
  );

  const projectFields = flattenFields(Object.values(PROJECT_FIELDSETS([])));
  for (const project of snapshot.projects) {
    addGap(`Project: ${projectName(project.title)}`, `/admin/projects/${project.id}`, missingArabic(projectFields, project as unknown as FormValues).length);
  }

  return {
    stats: {
      published: published.length,
      drafts: drafts.length,
      services: snapshot.services.filter((service) => service.visible).length,
      files: snapshot.media.length,
    },
    toDo,
    translationGaps,
    totalMissingArabic: translationGaps.reduce((total, gap) => total + gap.count, 0),
  };
}
