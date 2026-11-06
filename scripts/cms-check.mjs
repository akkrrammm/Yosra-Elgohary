// Checks the Supabase connection and security, and says what to do next.
// Prints no keys or passwords, so its output is safe to share.
//
//   npm run cms:check
import { createClient } from "@supabase/supabase-js";
import { loadEnv, publishableKey, secretKey, supabaseUrl } from "./lib/env.mjs";

loadEnv();

const OK = "ok  ";
const FAIL = "FAIL";
const WARN = "warn";
const SKIP = "--  ";

let failures = 0;
const line = (status, message) => {
  if (status === FAIL) failures += 1;
  console.log(`[${status}] ${message}`);
};

/** A legacy service role key is a JWT whose payload says so. */
const looksSecret = (value) => {
  if (value.startsWith("sb_secret_")) return true;
  const payload = value.split(".")[1];
  if (!payload) return false;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()).role === "service_role";
  } catch {
    return false;
  }
};

const url = supabaseUrl();
const publicKey = publishableKey();
const secret = secretKey();

// The most important check: nothing secret may ever reach the browser.
const exposed = Object.entries(process.env).filter(([name, value]) => name.startsWith("NEXT_PUBLIC_") && value && (looksSecret(value) || value === secret));
if (exposed.length > 0) {
  line(FAIL, `A secret key is in a browser-visible variable: ${exposed.map(([name]) => name).join(", ")}. Move it now, and rotate the key in Supabase.`);
} else {
  line(OK, "No secret key is exposed to the browser");
}

if (!url || !publicKey) {
  line(FAIL, "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are needed in .env.local");
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(url);
  line(OK, `Project address: ${parsed.origin}`);
} catch {
  line(FAIL, "NEXT_PUBLIC_SUPABASE_URL is not a valid address");
  process.exit(1);
}

const anonymous = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: settings, error: settingsError } = await anonymous.from("site_settings").select("seeded_at, allow_indexing").maybeSingle();
if (settingsError?.code === "PGRST205" || settingsError?.code === "42P01") {
  line(FAIL, "The CMS tables are not there yet. Run: npm run cms:migrate");
  process.exit(1);
} else if (settingsError) {
  line(FAIL, `Could not read from Supabase: ${settingsError.message}`);
  process.exit(1);
}
line(OK, "The publishable key can read the database");

if (settings?.seeded_at) line(OK, "The original content has been moved in");
else line(FAIL, "The original content has not been moved in yet. Run: npm run cms:seed");

/* ---------------------------------- what a visitor can reach ---------------------------------- */

const { data: drafts, error: draftsError } = await anonymous.from("projects").select("id").eq("status", "draft");
if (draftsError) line(FAIL, `Could not check drafts: ${draftsError.message}`);
else if (drafts.length > 0) line(FAIL, `Visitors can read ${drafts.length} draft project(s). Security rules are not active.`);
else line(OK, "Visitors cannot read draft projects");

const { data: admins, error: adminsError } = await anonymous.from("admin_users").select("user_id");
if (adminsError || admins.length === 0) line(OK, "Visitors cannot read the administrator list");
else line(FAIL, "Visitors can read the administrator list. Security rules are not active.");

// Writes back the value already there, so even a failed check changes no content.
const { data: changed, error: writeError } = await anonymous
  .from("site_settings")
  .update({ allow_indexing: settings?.allow_indexing ?? true })
  .eq("id", true)
  .select("id");
if (writeError || changed.length === 0) line(OK, "Visitors cannot change content");
else line(FAIL, "A visitor was able to change content. Security rules are not active.");

const probe = await anonymous.storage.from("cms-images").upload(`cms-check-${Date.now()}.txt`, new Blob(["x"], { type: "image/png" }));
if (probe.error) {
  line(OK, "Visitors cannot upload files");
} else {
  line(FAIL, "A visitor was able to upload a file. Storage rules are not active.");
  if (secret) await createClient(url, secret, { auth: { persistSession: false } }).storage.from("cms-images").remove([probe.data.path]);
}

/* ------------------------------------------ auth settings ------------------------------------------ */

try {
  const response = await fetch(`${parsed.origin}/auth/v1/settings`, { headers: { apikey: publicKey } });
  const authSettings = await response.json();
  if (authSettings.disable_signup) line(OK, "Public sign-ups are turned off");
  else line(WARN, "Public sign-ups are on. New accounts get no dashboard access, but turn this off anyway: Authentication > Sign In / Providers > Allow new users to sign up.");
} catch {
  line(WARN, "Could not read the sign-up setting");
}

/* -------------------------------------- with the secret key --------------------------------------- */

if (!secret) {
  line(SKIP, "SUPABASE_SECRET_KEY is not set, so buckets and administrators were not checked. That is fine once setup is finished.");
} else {
  const privileged = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: buckets, error: bucketsError } = await privileged.storage.listBuckets();
  if (bucketsError) line(FAIL, `Could not list storage buckets: ${bucketsError.message}`);
  else {
    const missing = ["cms-images", "cms-videos"].filter((id) => !buckets.some((bucket) => bucket.id === id));
    if (missing.length > 0) line(FAIL, `Storage buckets are missing: ${missing.join(", ")}. Run: npm run cms:migrate`);
    else line(OK, "Storage buckets exist");
  }

  const { count, error: countError } = await privileged.from("admin_users").select("user_id", { count: "exact", head: true });
  if (countError) line(FAIL, `Could not count administrators: ${countError.message}`);
  else if (!count) line(FAIL, "There is no administrator yet. Run: npm run cms:create-admin");
  else line(OK, `Administrators: ${count}`);
}

console.log(failures === 0 ? "\nAll good." : `\n${failures} problem(s) to fix.`);
process.exitCode = failures === 0 ? 0 : 1;
