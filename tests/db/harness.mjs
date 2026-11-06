// Runs the real migration files on PGlite, an embedded Postgres, with stand-ins for
// the parts Supabase provides (auth, storage, the anon and authenticated roles).
// This lets the database rules be tested with no Supabase project and no Docker.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const SUPABASE_STANDINS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create schema storage;
  grant usage on schema auth, storage, public to anon, authenticated, service_role;

  -- A new Supabase project opens every new table and function to these roles by default,
  -- so here too only what the migrations say protects anything.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

  create table auth.users (id uuid primary key default gen_random_uuid(), email text unique);

  -- The same way Supabase reads the signed-in user from the request's token.
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
  $$;
  grant execute on function auth.uid() to anon, authenticated, service_role;

  create table storage.buckets (
    id text primary key, name text, public boolean default false,
    file_size_limit bigint, allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text, owner uuid, metadata jsonb
  );
  alter table storage.objects enable row level security;
  grant all on storage.objects to anon, authenticated, service_role;
  grant select on storage.buckets to anon, authenticated, service_role;
`;

export const migrationsDir = path.join(import.meta.dirname, "..", "..", "supabase", "migrations");

export function migrationFiles() {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

/** An empty database shaped like a new Supabase project, before any migration. */
export async function createPlatform() {
  const db = new PGlite();
  await db.exec(SUPABASE_STANDINS);
  return db;
}

export async function createDatabase() {
  const db = await createPlatform();
  for (const file of migrationFiles()) {
    await db.exec(readFileSync(path.join(migrationsDir, file), "utf8"));
  }
  return db;
}

/**
 * Runs `work` as a visitor (no userId) or as a signed-in user, the way PostgREST does:
 * inside a transaction with the role and token claims set. Changes are rolled back
 * unless `commit` is true, so each check starts from the same data.
 */
export async function as(db, userId, work, { commit = false } = {}) {
  const role = userId ? "authenticated" : "anon";
  const claims = JSON.stringify(userId ? { sub: userId, role } : { role });
  await db.exec("begin");
  try {
    await db.query("select set_config('request.jwt.claims', $1, true)", [claims]);
    await db.exec(`set local role ${role}`);
    const result = await work(db);
    await db.exec(commit ? "commit" : "rollback");
    return result;
  } catch (error) {
    await db.exec("rollback");
    throw error;
  }
}

/** Runs SQL with full privileges, for setting up test data. */
export const asSuperuser = (db, sql, params) => db.query(sql, params);
