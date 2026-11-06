import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MediaRow } from "@/lib/supabase/database.types";
import { supabaseUrl } from "@/lib/supabase/env";
import type { MediaItem } from "./fields";
import { publicMediaUrl } from "./media";

export const toMediaItem = (row: MediaRow): MediaItem => ({
  id: row.id,
  url: publicMediaUrl(supabaseUrl, row.bucket, row.path),
  bucket: row.bucket,
  path: row.path,
  kind: row.kind,
  folder: row.folder,
  mime_type: row.mime_type,
  size_bytes: row.size_bytes,
  width: row.width,
  height: row.height,
  original_name: row.original_name,
  alt: row.alt,
  created_at: row.created_at,
});

/** Loads the files a form refers to, so it can show their previews. */
export async function loadMediaItems(supabase: SupabaseClient<Database>, ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const items = new Map<string, MediaItem>();
  if (unique.length === 0) return items;

  const { data, error } = await supabase.from("media_assets").select("*").in("id", unique);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) items.set(row.id, toMediaItem(row));
  return items;
}
