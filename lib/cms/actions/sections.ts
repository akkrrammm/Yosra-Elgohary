"use server";

import type { Json } from "@/lib/supabase/database.types";
import { type ActionResult, asAdmin, explainError, failure, GONE, publishChanges, success } from "../admin";
import { SECTIONS, type SectionKey } from "../definitions";
import { type FieldDef, flattenFields, type FormValues, type MediaItem, sanitizeFields, validateFields } from "../fields";

const isSectionKey = (key: string): key is SectionKey => key in SECTIONS;

/** Text goes into the section's content, images into the media table. */
function splitMedia(fields: FieldDef[], values: FormValues) {
  const content: FormValues = {};
  const media: { slot: string; position: number; media_id: string }[] = [];

  for (const field of fields) {
    const value = values[field.key];
    if (field.type !== "media") {
      content[field.key] = value;
      continue;
    }
    const items = (Array.isArray(value) ? value : value ? [value] : []) as MediaItem[];
    items.forEach((item, position) => media.push({ slot: field.key, position, media_id: item.id }));
  }

  return { content, media };
}

export async function saveSection(key: string, rawValues: FormValues, visible?: boolean): Promise<ActionResult> {
  if (!isSectionKey(key)) return failure("This section does not exist.");

  return asAdmin(async (supabase) => {
    const fields = flattenFields(SECTIONS[key].fieldsets);
    const values = sanitizeFields(fields, rawValues);
    const errors = validateFields(fields, values);
    if (Object.keys(errors).length > 0) return failure("Please fix the highlighted fields.", errors);

    const { content, media } = splitMedia(fields, values);
    const { error } = await supabase.rpc("save_section", {
      p_key: key,
      p_content: content as Json,
      p_media: media as Json,
      ...(visible === undefined ? {} : { p_visible: visible }),
    });
    if (error) return explainError(error);

    publishChanges();
    return success();
  });
}

export async function setSectionVisible(key: string, visible: boolean): Promise<ActionResult> {
  if (!isSectionKey(key)) return failure("This section does not exist.");

  return asAdmin(async (supabase) => {
    const { data, error } = await supabase.from("site_sections").update({ visible }).eq("key", key).select("key");
    if (error) return explainError(error);
    if (!data.length) return GONE;
    publishChanges();
    return success();
  });
}

export async function reorderHomepage(keys: string[]): Promise<ActionResult> {
  if (!keys.every(isSectionKey)) return failure("This section does not exist.");

  return asAdmin(async (supabase) => {
    // Sections start after the hero and ribbon, which always come first.
    const { error } = await supabase.rpc("reorder_sections", { p_keys: ["hero", "ribbon", ...keys] });
    if (error) return explainError(error);
    publishChanges();
    return success();
  });
}
