import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { cache } from "react";
import type { Database, MediaRow } from "@/lib/supabase/database.types";
import { isSupabaseConfigured, supabaseUrl } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { CMS_CACHE_TAG } from "./constants";
import { publicMediaUrl } from "./media";
import { buildSeed } from "./seed";
import type { CmsSnapshot } from "./types";

type Client = SupabaseClient<Database>;

/** PostgREST and Postgres codes that mean "the tables are not there yet". */
const NOT_MIGRATED = new Set(["PGRST205", "42P01"]);

class NotMigratedError extends Error {}

function rows<T>(table: string, result: { data: T[] | null; error: { code?: string; message: string } | null }): T[] {
  if (result.error) {
    if (result.error.code && NOT_MIGRATED.has(result.error.code)) throw new NotMigratedError(result.error.message);
    throw new Error(`Could not read ${table}: ${result.error.message}`);
  }
  return result.data ?? [];
}

const withUrl = (row: MediaRow) => ({ ...row, url: publicMediaUrl(supabaseUrl, row.bucket, row.path) });

export async function fetchSnapshot(client: Client): Promise<CmsSnapshot> {
  const [
    settings,
    sections,
    sectionMedia,
    media,
    categories,
    projects,
    gallery,
    wall,
    services,
    serviceProjects,
    steps,
    achievements,
    socials,
    navigation,
    seo,
  ] = await Promise.all([
    client.from("site_settings").select("*").limit(1),
    client.from("site_sections").select("*").order("display_order"),
    client.from("section_media").select("*").order("position"),
    client.from("media_assets").select("*"),
    client.from("project_categories").select("*").order("display_order"),
    client.from("projects").select("*").order("display_order"),
    client.from("project_gallery").select("*").order("display_order"),
    client.from("wall_items").select("*").order("display_order"),
    client.from("services").select("*").order("display_order"),
    client.from("service_projects").select("*").order("display_order"),
    client.from("process_steps").select("*").order("display_order"),
    client.from("achievements").select("*").order("display_order"),
    client.from("social_links").select("*").order("display_order"),
    client.from("navigation_items").select("*").order("display_order"),
    client.from("seo_metadata").select("*"),
  ]);

  return {
    settings: rows("site_settings", settings)[0] ?? null,
    sections: rows("site_sections", sections),
    sectionMedia: rows("section_media", sectionMedia),
    media: rows("media_assets", media).map(withUrl),
    categories: rows("project_categories", categories),
    projects: rows("projects", projects),
    gallery: rows("project_gallery", gallery),
    wall: rows("wall_items", wall),
    services: rows("services", services),
    serviceProjects: rows("service_projects", serviceProjects),
    steps: rows("process_steps", steps),
    achievements: rows("achievements", achievements),
    socials: rows("social_links", socials),
    navigation: rows("navigation_items", navigation),
    seo: rows("seo_metadata", seo),
  };
}

const seedSnapshot = cache((): CmsSnapshot => buildSeed());

/** What every visitor sees. Cached across requests until an admin saves a change. */
const cachedPublicSnapshot = unstable_cache(
  async () => {
    try {
      const snapshot = await fetchSnapshot(createPublicClient());
      // Connected but not seeded yet: show the original content rather than an empty site.
      return snapshot.settings ? snapshot : null;
    } catch (error) {
      if (error instanceof NotMigratedError) return null;
      throw error;
    }
  },
  ["cms-public-snapshot"],
  { tags: [CMS_CACHE_TAG], revalidate: 3600 },
);

/** Published content only, for places outside a page request, such as the sitemap. */
export async function getPublishedSnapshot(): Promise<CmsSnapshot> {
  if (!isSupabaseConfigured()) return seedSnapshot();
  return (await cachedPublicSnapshot()) ?? seedSnapshot();
}

/**
 * The content for this page request. In preview mode it is read as the signed-in
 * administrator, so drafts appear. Row Level Security means anyone else who somehow
 * has the preview cookie still only gets published content.
 */
export const getCmsSnapshot = cache(async (): Promise<{ snapshot: CmsSnapshot; isPreview: boolean }> => {
  if (!isSupabaseConfigured()) return { snapshot: seedSnapshot(), isPreview: false };

  const { isEnabled } = await draftMode();
  if (isEnabled) {
    const snapshot = await fetchSnapshot(await createClient());
    return { snapshot: snapshot.settings ? snapshot : seedSnapshot(), isPreview: true };
  }
  return { snapshot: await getPublishedSnapshot(), isPreview: false };
});
