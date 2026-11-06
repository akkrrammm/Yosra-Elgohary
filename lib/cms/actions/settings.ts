"use server";

import type { Json, SeoPageKey } from "@/lib/supabase/database.types";
import { type ActionResult, asAdmin, explainError, failure, publishChanges, success } from "../admin";
import { SEO_FIELDSETS, SEO_PAGES, SETTINGS_GROUPS, type SettingsGroupKey } from "../definitions";
import { flattenFields, type FormValues, type MediaItem, sanitizeFields, validateFields } from "../fields";

const isGroup = (key: string): key is SettingsGroupKey => key in SETTINGS_GROUPS;

export async function saveSettings(group: string, rawValues: FormValues): Promise<ActionResult> {
  if (!isGroup(group)) return failure("These settings do not exist.");

  return asAdmin(async (supabase) => {
    const fields = flattenFields(SETTINGS_GROUPS[group].fieldsets);
    const values = sanitizeFields(fields, rawValues);
    const errors = validateFields(fields, values);

    if ("title_template" in values && !String(values.title_template).includes("%s")) {
      errors.title_template = "Keep %s in the pattern. It is replaced with the page title.";
    }
    if ("default_locale" in values && Array.isArray(values.available_locales) && !values.available_locales.includes(values.default_locale)) {
      errors.available_locales = "The default language has to be one of the available languages.";
    }
    if (Object.keys(errors).length > 0) return failure("Please fix the highlighted fields.", errors);

    const row: Record<string, unknown> = {};
    for (const field of fields) {
      const value = values[field.key];
      if (field.type === "media") row[field.key] = (value as MediaItem | null)?.id ?? null;
      else if (field.type === "email" || field.type === "phone") row[field.key] = value || null;
      else row[field.key] = value;
    }

    const { data, error } = await supabase.from("site_settings").update(row as never).eq("id", true).select("id");
    if (error) return explainError(error);
    if (!data.length) return failure("The website's starting content has not been moved in yet. Run npm run cms:seed first.");

    publishChanges();
    return success();
  });
}

const SEO_KEYS = new Set<string>(SEO_PAGES.map((page) => page.key));

export async function saveSeoPage(pageKey: string, rawValues: FormValues): Promise<ActionResult> {
  if (!SEO_KEYS.has(pageKey)) return failure("This page does not exist.");

  return asAdmin(async (supabase) => {
    const fields = flattenFields(SEO_FIELDSETS);
    const values = sanitizeFields(fields, rawValues);
    const errors = validateFields(fields, values);
    if (Object.keys(errors).length > 0) return failure("Please fix the highlighted fields.", errors);

    const { error } = await supabase.from("seo_metadata").upsert(
      {
        page_key: pageKey as SeoPageKey,
        ...(values as Record<string, Json>),
        og_media_id: (values.og_media_id as MediaItem | null)?.id ?? null,
        canonical_url: (values.canonical_url as string) || null,
      } as never,
      { onConflict: "page_key" },
    );
    if (error) return explainError(error);

    publishChanges();
    return success();
  });
}
