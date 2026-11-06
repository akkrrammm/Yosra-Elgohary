"use server";

import { z } from "zod";
import type { Json } from "@/lib/supabase/database.types";
import { type ActionResult, asAdmin, explainError, failure, GONE, publishChanges, success, successWith } from "../admin";
import { PROJECT_FIELDSETS, SEO_FIELDSETS } from "../definitions";
import { flattenFields, type FormValues, type MediaItem, sanitizeFields, slugify, validateFields } from "../fields";

const id = z.uuid();

export type GalleryInput = {
  media: MediaItem;
  caption: { en?: string; ar?: string };
  deck_position: number | null;
};

export type ProjectInput = {
  values: FormValues;
  seo: FormValues;
  gallery: GalleryInput[];
  status: "draft" | "published";
};

const SLUG_TAKEN = "Another project already uses this web address. Please choose a different one.";

export async function saveProject(projectId: string | null, input: ProjectInput): Promise<ActionResult<{ id: string }>> {
  if (projectId !== null && !id.safeParse(projectId).success) return failure("This project could not be found.");

  return asAdmin(async (supabase) => {
    const { data: categories, error: categoriesError } = await supabase.from("project_categories").select("id");
    if (categoriesError) return explainError(categoriesError);

    const fieldsets = PROJECT_FIELDSETS((categories ?? []).map((category) => ({ value: category.id, label: "" })));
    const fields = flattenFields(Object.values(fieldsets));
    const values = sanitizeFields(fields, input.values);

    const title = values.title as { en?: string };
    if (!values.slug && title.en) values.slug = slugify(title.en);

    const errors = validateFields(fields, values);
    const seoFields = flattenFields(SEO_FIELDSETS);
    const seo = sanitizeFields(seoFields, input.seo);
    for (const [path, message] of Object.entries(validateFields(seoFields, seo))) errors[`seo.${path}`] = message;

    if (input.status === "published" && !values.cover_media_id) {
      errors.cover_media_id = "Add a cover image before publishing this project.";
    }
    if (Object.keys(errors).length > 0) return failure("Please fix the highlighted fields.", errors);

    const project = {
      ...values,
      status: input.status,
      cover_media_id: (values.cover_media_id as MediaItem | null)?.id ?? null,
      video_media_id: (values.video_media_id as MediaItem | null)?.id ?? null,
    };

    const gallery = input.gallery.map((item) => ({
      media_id: item.media.id,
      caption: sanitizeFields([{ key: "caption", label: "", type: "text", localized: true }], { caption: item.caption }).caption,
      deck_position: item.deck_position,
    }));

    const { data, error } = await supabase.rpc("save_project", {
      p_id: projectId,
      p_project: project as Json,
      p_gallery: gallery as Json,
      p_seo: {
        ...seo,
        og_media_id: (seo.og_media_id as MediaItem | null)?.id ?? null,
      } as Json,
    });
    if (error) return explainError(error, { unique: SLUG_TAKEN });

    publishChanges();
    return successWith({ id: data });
  });
}

export async function setProjectStatus(projectId: string, status: "draft" | "published"): Promise<ActionResult> {
  if (!id.safeParse(projectId).success) return failure("This project could not be found.");

  return asAdmin(async (supabase) => {
    const { data, error } = await supabase.from("projects").update({ status }).eq("id", projectId).select("id");
    if (error) return explainError(error);
    if (!data.length) return GONE;
    publishChanges();
    return success();
  });
}

export async function setProjectFeatured(projectId: string, featured: boolean): Promise<ActionResult> {
  if (!id.safeParse(projectId).success) return failure("This project could not be found.");

  return asAdmin(async (supabase) => {
    const { data, error } = await supabase.from("projects").update({ featured }).eq("id", projectId).select("id");
    if (error) return explainError(error);
    if (!data.length) return GONE;
    publishChanges();
    return success();
  });
}

export async function duplicateProject(projectId: string): Promise<ActionResult<{ id: string }>> {
  if (!id.safeParse(projectId).success) return failure("This project could not be found.");

  return asAdmin(async (supabase) => {
    const { data, error } = await supabase.rpc("duplicate_project", { p_id: projectId });
    if (error) return explainError(error);
    publishChanges();
    return successWith({ id: data });
  });
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  if (!id.safeParse(projectId).success) return failure("This project could not be found.");

  return asAdmin(async (supabase) => {
    const { error } = await supabase.from("projects").delete().eq("id", projectId);
    if (error) return explainError(error);
    publishChanges();
    return success();
  });
}

export async function reorderProjects(ids: string[]): Promise<ActionResult> {
  if (!z.array(id).safeParse(ids).success) return failure("The projects could not be reordered.");

  return asAdmin(async (supabase) => {
    const { error } = await supabase.rpc("reorder_rows", { p_table: "projects", p_ids: ids });
    if (error) return explainError(error);
    publishChanges();
    return success();
  });
}

export async function saveWall(items: { gallery_item_id: string; row_index: number }[]): Promise<ActionResult> {
  const parsed = z.array(z.object({ gallery_item_id: id, row_index: z.union([z.literal(0), z.literal(1)]) })).safeParse(items);
  if (!parsed.success) return failure("The wall could not be saved.");

  return asAdmin(async (supabase) => {
    const { error } = await supabase.rpc("save_wall", { p_items: parsed.data as Json });
    if (error) return explainError(error);
    publishChanges();
    return success();
  });
}
