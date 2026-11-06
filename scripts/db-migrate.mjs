// Creates the CMS tables, security rules and storage buckets in Supabase.
//
//   npm run cms:migrate -- --dry-run    Inspect only. Changes nothing.
//   npm run cms:migrate                 Inspect, then apply what is new.
//
// Needs SUPABASE_DB_URL in .env.local. Leave [YOUR-PASSWORD] in it and this asks for the database
// password, hidden, so the password is never written to a file. Symbols in it are handled for you.
// Safe to run again: applied migrations are skipped. It never drops anything, and it stops
// without changing anything if a table or type it would create already exists.
import path from "node:path";
import pg from "pg";
import { loadEnv, requireEnv } from "./lib/env.mjs";
import { applyMigrations, inspectDatabase, readMigrations } from "./lib/migrate.mjs";
import { askHidden } from "./lib/prompt.mjs";

loadEnv();
let connectionString = process.env.SUPABASE_DB_URL ?? "";
requireEnv([[connectionString, "SUPABASE_DB_URL"]]);

if (connectionString.includes("[YOUR-PASSWORD]")) {
  const password = await askHidden("Database password (hidden): ");
  if (!password) {
    console.error("No password entered. Nothing was changed.");
    process.exit(1);
  }
  connectionString = connectionString.replace("[YOUR-PASSWORD]", encodeURIComponent(password));
}

let url;
try {
  url = new URL(connectionString);
} catch {
  // The value holds a password, so it is deliberately not repeated here.
  console.error("SUPABASE_DB_URL is not a valid address. Copy it again from Supabase and leave [YOUR-PASSWORD] in it: this command asks for the password.");
  process.exit(1);
}

const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);
url.searchParams.delete("sslmode");

const client = new pg.Client({
  connectionString: url.toString(),
  // Encrypted either way. Supabase's certificate authority is not in Node's default trust store.
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

const dryRun = process.argv.includes("--dry-run");

try {
  await client.connect();

  const migrations = await readMigrations(path.join(process.cwd(), "supabase", "migrations"));
  const report = await inspectDatabase(client, migrations);

  console.log(`Already applied: ${report.applied.length ? report.applied.join(", ") : "none"}`);
  console.log(`To apply:        ${report.pending.length ? report.pending.map((migration) => migration.file).join(", ") : "none"}`);
  console.log(`Other tables left untouched: ${report.unrelatedTables.length ? report.unrelatedTables.join(", ") : "none"}`);

  if (report.conflicts.length > 0) {
    console.error("\nStopped. Nothing was changed. These already exist and did not come from these migrations:");
    for (const conflict of report.conflicts) console.error(`  - ${conflict}`);
    console.error("Decide what should happen to them first. This script will not overwrite existing data.");
    process.exitCode = 1;
  } else if (dryRun) {
    console.log("\nDry run: nothing was changed.");
  } else if (report.pending.length === 0) {
    console.log("\nThe database is up to date.");
  } else {
    await applyMigrations(client, report.pending, (message) => console.log(message));
    console.log("\nDone. Next: npm run cms:seed");
  }
} catch (error) {
  console.error(`\nCould not finish: ${error.message}`);
  if (error.code === "ENOTFOUND" || error.code === "ETIMEDOUT" || error.code === "ENETUNREACH") {
    console.error("Could not reach the database. In Supabase, use the Session pooler connection string, which works on every network.");
  }
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
