import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseKey, supabaseUrl } from "./env";

/**
 * For Client Components. Used by the admin dashboard to upload files straight to
 * Storage, so large files never pass through the Next.js server.
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
