import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Applies supabase/migrations safely. Everything here only needs `client.query(sql, params?)`,
 * so the same code is tested against an in-memory database in tests/db/migrate.test.mjs.
 *
 * It looks before it touches anything: if a table or type this CMS would create already
 * exists and is not from an earlier run of these migrations, it stops with nothing changed.
 */

const HISTORY = "supabase_migrations.schema_migrations";

export async function readMigrations(directory) {
  const names = (await readdir(directory)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
  return Promise.all(
    names.map(async (file) => {
      const sql = await readFile(path.join(directory, file), "utf8");
      const [, version, name] = file.match(/^(\d+)_(.+)\.sql$/);
      return { file, version, name, sql };
    }),
  );
}

const namesIn = (sql, pattern) => [...sql.matchAll(pattern)].map((match) => match[1]);

/** The tables and types the given migrations would create in the public schema. */
export function plannedObjects(migrations) {
  const sql = migrations.map((migration) => migration.sql).join("\n");
  return {
    tables: [...new Set(namesIn(sql, /create table (?:if not exists )?public\.(\w+)/gi))],
    types: [...new Set(namesIn(sql, /create type public\.(\w+)/gi))],
  };
}

export async function inspectDatabase(client, migrations) {
  const { rows: historyRows } = await client.query(`select to_regclass('${HISTORY}') is not null as present`);
  const applied = historyRows[0].present ? (await client.query(`select version from ${HISTORY}`)).rows.map((row) => row.version) : [];

  const { rows: tables } = await client.query(`select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name`);
  const { rows: types } = await client.query(`select t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typtype = 'e'`);

  const existingTables = tables.map((row) => row.table_name);
  const existingTypes = types.map((row) => row.typname);
  const pending = migrations.filter((migration) => !applied.includes(migration.version));
  const planned = plannedObjects(pending);

  // A pending migration may safely re-declare what an applied one made, so only a
  // database with no history for that object counts as a real conflict.
  const appliedPlan = plannedObjects(migrations.filter((migration) => applied.includes(migration.version)));
  const conflicts = [
    ...planned.tables.filter((name) => existingTables.includes(name) && !appliedPlan.tables.includes(name)).map((name) => `table public.${name}`),
    ...planned.types.filter((name) => existingTypes.includes(name) && !appliedPlan.types.includes(name)).map((name) => `type public.${name}`),
  ];

  const ours = new Set(plannedObjects(migrations).tables);

  return {
    applied,
    pending,
    conflicts,
    unrelatedTables: existingTables.filter((name) => !ours.has(name)),
  };
}

/** Each migration runs in its own transaction, so a failure leaves that file fully undone. */
export async function applyMigrations(client, pending, log = () => {}) {
  await client.query(`create schema if not exists supabase_migrations`);
  await client.query(`create table if not exists ${HISTORY} (version text primary key, statements text[], name text)`);

  for (const migration of pending) {
    log(`Applying ${migration.file} ...`);
    await client.query("begin");
    try {
      await client.query(migration.sql);
      const name = migration.name.replaceAll("'", "''");
      await client.query(`insert into ${HISTORY} (version, name) values ('${migration.version}', '${name}')`);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw new Error(`${migration.file} failed and was undone: ${error.message}`, { cause: error });
    }
  }

  // So Supabase's API sees the new tables straight away.
  await client.query("notify pgrst, 'reload schema'");
}
