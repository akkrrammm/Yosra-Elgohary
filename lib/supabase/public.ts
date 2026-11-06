import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseKey, supabaseUrl } from "./env";

/**
 * Reads what any visitor may read, with no cookies and no session. Because nothing
 * here depends on who is asking, its results can be cached for every visitor.
 * Row Level Security keeps drafts and hidden content out of these queries.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
