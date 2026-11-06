// The migration runner against a real (in-memory) Postgres: it must look before it touches
// anything, refuse to overwrite existing data, and be safe to run twice.
// Run with: npm run test:db
import assert from "node:assert/strict";
import { test } from "node:test";
import { applyMigrations, inspectDatabase, plannedObjects, readMigrations } from "../../scripts/lib/migrate.mjs";
import { createPlatform, migrationsDir } from "./harness.mjs";

/** Gives PGlite the same `query` shape as the `pg` client the real script uses. */
const clientFor = (db) => ({
  query: async (sql) => {
    const results = await db.exec(sql);
    return results.at(-1) ?? { rows: [] };
  },
});

const migrations = await readMigrations(migrationsDir);

test("the plan names every table the CMS needs", () => {
  const { tables, types } = plannedObjects(migrations);
  for (const table of ["admin_users", "media_assets", "site_settings", "projects", "project_gallery", "seo_metadata"]) {
    assert.ok(tables.includes(table), table);
  }
  assert.ok(types.includes("publish_status"));
});

test("a fresh database gets every migration, and a second run does nothing", async () => {
  const db = await createPlatform();
  const client = clientFor(db);

  const first = await inspectDatabase(client, migrations);
  assert.deepEqual(first.conflicts, []);
  assert.equal(first.pending.length, migrations.length);

  await applyMigrations(client, first.pending);

  const { rows } = await db.query(`select count(*)::int as tables from information_schema.tables where table_schema = 'public'`);
  assert.ok(rows[0].tables >= 16);

  const second = await inspectDatabase(client, migrations);
  assert.equal(second.pending.length, 0);
  assert.deepEqual(second.conflicts, []);
  assert.equal(second.applied.length, migrations.length);
  await db.close();
});

test("an existing table with the same name stops everything and keeps its data", async () => {
  const db = await createPlatform();
  await db.exec(`
    create table public.projects (id serial primary key, name text);
    insert into public.projects (name) values ('Someone else''s data');
  `);
  const client = clientFor(db);

  const report = await inspectDatabase(client, migrations);
  assert.deepEqual(report.conflicts, ["table public.projects"]);

  // The script stops here, so nothing else may have been created by inspecting.
  const { rows: created } = await db.query(`select to_regclass('public.admin_users') as admin, to_regclass('supabase_migrations.schema_migrations') as history`);
  assert.equal(created[0].admin, null);
  assert.equal(created[0].history, null);

  const { rows } = await db.query(`select name from public.projects`);
  assert.deepEqual(rows, [{ name: "Someone else's data" }]);
  await db.close();
});

test("unrelated tables are reported and left alone", async () => {
  const db = await createPlatform();
  await db.exec(`create table public.newsletter (email text); insert into public.newsletter values ('a@example.com');`);
  const client = clientFor(db);

  const report = await inspectDatabase(client, migrations);
  assert.deepEqual(report.conflicts, []);
  assert.deepEqual(report.unrelatedTables, ["newsletter"]);

  await applyMigrations(client, report.pending);
  const { rows } = await db.query(`select email from public.newsletter`);
  assert.deepEqual(rows, [{ email: "a@example.com" }]);
  await db.close();
});

test("a failing migration is fully undone and recorded as not applied", async () => {
  const db = await createPlatform();
  const client = clientFor(db);

  const broken = [{ file: "0009_broken.sql", version: "0009", name: "broken", sql: "create table public.half_done (id int); select 1/0;" }];
  await assert.rejects(applyMigrations(client, broken), /0009_broken\.sql failed and was undone/);

  const { rows } = await db.query(`select to_regclass('public.half_done') as half, (select count(*)::int from supabase_migrations.schema_migrations) as applied`);
  assert.equal(rows[0].half, null);
  assert.equal(rows[0].applied, 0);
  await db.close();
});
