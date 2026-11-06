import { createRequire } from "node:module";
import path from "node:path";

/** Reads .env.local the same way the website does. Never prints a value. */
export function loadEnv() {
  // Loaded this way because the seed script runs through a different module loader than the others.
  const { loadEnvConfig } = createRequire(path.join(process.cwd(), "package.json"))("@next/env");
  loadEnvConfig(process.cwd(), false, { info() {}, error: console.error });
}

export const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const publishableKey = () => process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const secretKey = () => process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function requireEnv(checks) {
  const missing = checks.filter(([value]) => !value).map(([, name]) => name);
  if (missing.length > 0) {
    console.error(`Missing from .env.local: ${missing.join(", ")}`);
    console.error("See .env.example for where each value comes from.");
    process.exit(1);
  }
}
