/**
 * The public connection details. These are meant to reach the browser: access is
 * controlled by Row Level Security in the database, not by keeping them secret.
 *
 * Next.js only inlines NEXT_PUBLIC_ values when they are written out in full, so
 * they cannot be read through a helper that takes the name as an argument.
 */
export const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");

export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseKey);
