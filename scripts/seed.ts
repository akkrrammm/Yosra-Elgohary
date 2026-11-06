// Moves the website's original content and images into Supabase.
//
//   npm run cms:seed                      Runs once. Later runs change nothing.
//   npm run cms:seed -- --restore-missing Puts back original items that are missing.
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.
//
// Safe to run again: rows are matched by fixed ids and only added if absent, and files are only
// uploaded if absent, so nothing is duplicated and nothing edited in the dashboard is overwritten.
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { buildSeed } from "../lib/cms/seed";
import type { Database } from "../lib/supabase/database.types";
import { loadEnv, requireEnv, secretKey, supabaseUrl } from "./lib/env.mjs";

loadEnv();
requireEnv([
  [supabaseUrl(), "NEXT_PUBLIC_SUPABASE_URL"],
  [secretKey(), "SUPABASE_SECRET_KEY"],
]);

// Tables are written in this order so everything a row points at already exists.
type TableName = keyof Database["public"]["Tables"];

const BATCH = 200;
const UPLOADS_AT_ONCE = 6;

const supabase = createClient<Database>(supabaseUrl(), secretKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const restoreMissing = process.argv.includes("--restore-missing");
const seed = buildSeed();

/** Timestamps are left to the database, which knows when the row really arrived. */
const withoutTimestamps = (row: object) => {
  const clean: Record<string, unknown> = { ...row };
  delete clean.created_at;
  delete clean.updated_at;
  return clean;
};

async function addMissing(table: TableName, rows: object[], onConflict: string) {
  const clean = rows.map(withoutTimestamps);
  for (let start = 0; start < clean.length; start += BATCH) {
    const { error } = await supabase.from(table).upsert(clean.slice(start, start + BATCH) as never, { onConflict, ignoreDuplicates: true });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log(`  ${table}: ${rows.length}`);
}

async function runInPool<T>(items: T[], worker: (item: T) => Promise<void>) {
  let next = 0;
  const run = async () => {
    while (next < items.length) await worker(items[next++]);
  };
  await Promise.all(Array.from({ length: UPLOADS_AT_ONCE }, run));
}

async function main() {
  const { data: settings, error: settingsError } = await supabase.from("site_settings").select("seeded_at").maybeSingle();
  if (settingsError) {
    if (settingsError.code === "PGRST205" || settingsError.code === "42P01") {
      throw new Error("The CMS tables are not there yet. Run npm run cms:migrate first.");
    }
    throw new Error(settingsError.message);
  }

  if (settings?.seeded_at && !restoreMissing) {
    console.log(`Already seeded on ${settings.seeded_at}. Nothing was changed.`);
    console.log("To put back original items that are missing, add --restore-missing.");
    return;
  }

  console.log(`Uploading ${seed.media.length} files (existing files are left alone) ...`);
  const sizes = new Map<string, number>();
  let uploaded = 0;
  let skipped = 0;

  await runInPool(seed.media, async (item) => {
    const file = path.join(process.cwd(), "public", item.localFile);
    const { size } = await stat(file);
    sizes.set(item.id, size);

    const { error } = await supabase.storage.from(item.bucket).upload(item.path, await readFile(file), {
      contentType: item.mime_type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (!error) {
      uploaded += 1;
      return;
    }
    const status = (error as { statusCode?: string; status?: number }).statusCode ?? (error as { status?: number }).status;
    if (String(status) === "409" || /already exists/i.test(error.message)) {
      skipped += 1;
      return;
    }
    throw new Error(`Could not upload ${item.localFile}: ${error.message}`);
  });
  console.log(`  ${uploaded} uploaded, ${skipped} already there`);

  console.log("Adding content (existing rows are left alone) ...");
  const mediaRows = seed.media.map((item) => {
    const row: Record<string, unknown> = { ...item, size_bytes: sizes.get(item.id) ?? 0 };
    delete row.url;
    delete row.localFile;
    return row;
  });

  await addMissing("media_assets", mediaRows, "id");
  await addMissing("site_settings", [seed.settings], "id");
  await addMissing("site_sections", seed.sections, "key");
  await addMissing("section_media", seed.sectionMedia, "section_key,slot,position");
  await addMissing("project_categories", seed.categories, "id");
  await addMissing("projects", seed.projects, "id");
  await addMissing("project_gallery", seed.gallery, "id");
  await addMissing("wall_items", seed.wall, "id");
  await addMissing("services", seed.services, "id");
  await addMissing("service_projects", seed.serviceProjects, "service_id,project_id");
  await addMissing("process_steps", seed.steps, "id");
  await addMissing("achievements", seed.achievements, "id");
  await addMissing("social_links", seed.socials, "id");
  await addMissing("navigation_items", seed.navigation, "id");
  await addMissing("seo_metadata", seed.seo, "id");

  const { error: stampError } = await supabase.from("site_settings").update({ seeded_at: new Date().toISOString() }).eq("id", true);
  if (stampError) throw new Error(stampError.message);

  console.log("\nDone. The website now reads from Supabase. Next: npm run cms:create-admin");
}

main().catch((error: Error) => {
  // Nothing is marked as seeded, so running this again picks up where it stopped.
  console.error(`\nStopped: ${error.message}`);
  console.error("Everything added so far is safe. Fix the problem and run this again to continue.");
  process.exitCode = 1;
});
