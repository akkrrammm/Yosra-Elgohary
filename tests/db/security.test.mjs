// Proves the database rules, using the real migration files.
// Run with: npm run test:db
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { before, describe, test } from "node:test";
import { as, asSuperuser, createDatabase, migrationFiles, migrationsDir } from "./harness.mjs";

const ADMIN = "00000000-0000-4000-8000-000000000001";
const OWNER = "00000000-0000-4000-8000-000000000002";
const STRANGER = "00000000-0000-4000-8000-000000000003";

const IDS = {
  publicMedia: "10000000-0000-4000-8000-000000000001",
  draftMedia: "10000000-0000-4000-8000-000000000002",
  unusedMedia: "10000000-0000-4000-8000-000000000003",
  hiddenSectionMedia: "10000000-0000-4000-8000-000000000004",
  category: "20000000-0000-4000-8000-000000000001",
  published: "30000000-0000-4000-8000-000000000001",
  draft: "30000000-0000-4000-8000-000000000002",
  publishedGallery: "40000000-0000-4000-8000-000000000001",
  draftGallery: "40000000-0000-4000-8000-000000000002",
  visibleService: "50000000-0000-4000-8000-000000000001",
  hiddenService: "50000000-0000-4000-8000-000000000002",
};

const count = async (db, sql) => Number((await db.query(`select count(*)::int as n from ${sql}`)).rows[0].n);
const rejects = (promise, pattern) => assert.rejects(promise, pattern);

let db;

before(async () => {
  db = await createDatabase();

  await asSuperuser(db, `insert into auth.users (id, email) values ('${ADMIN}', 'admin@test'), ('${OWNER}', 'owner@test'), ('${STRANGER}', 'stranger@test')`);
  await asSuperuser(db, `insert into public.admin_users (user_id, role) values ('${ADMIN}', 'editor'), ('${OWNER}', 'owner')`);

  await asSuperuser(db, `
    insert into public.media_assets (id, bucket, path, mime_type, size_bytes) values
      ('${IDS.publicMedia}', 'cms-images', 'projects/public.webp', 'image/webp', 100),
      ('${IDS.draftMedia}', 'cms-images', 'projects/draft.webp', 'image/webp', 100),
      ('${IDS.unusedMedia}', 'cms-images', 'other/unused.webp', 'image/webp', 100),
      ('${IDS.hiddenSectionMedia}', 'cms-images', 'sections/hidden.webp', 'image/webp', 100)
  `);
  await asSuperuser(db, `insert into public.project_categories (id, slug, name) values ('${IDS.category}', 'video', '{"en":"Video"}')`);
  await asSuperuser(db, `
    insert into public.projects (id, slug, title, status, cover_media_id, category_id) values
      ('${IDS.published}', 'published-one', '{"en":"Published"}', 'published', '${IDS.publicMedia}', '${IDS.category}'),
      ('${IDS.draft}', 'secret-draft', '{"en":"Secret draft"}', 'draft', '${IDS.draftMedia}', '${IDS.category}')
  `);
  await asSuperuser(db, `
    insert into public.project_gallery (id, project_id, media_id) values
      ('${IDS.publishedGallery}', '${IDS.published}', '${IDS.publicMedia}'),
      ('${IDS.draftGallery}', '${IDS.draft}', '${IDS.draftMedia}')
  `);
  await asSuperuser(db, `
    insert into public.wall_items (gallery_item_id, row_index) values
      ('${IDS.publishedGallery}', 0), ('${IDS.draftGallery}', 1)
  `);
  await asSuperuser(db, `
    insert into public.seo_metadata (project_id, title) values
      ('${IDS.published}', '{"en":"Public SEO"}'), ('${IDS.draft}', '{"en":"Draft SEO"}')
  `);
  await asSuperuser(db, `insert into public.seo_metadata (page_key, title) values ('home', '{"en":"Home"}')`);
  await asSuperuser(db, `insert into public.site_settings (site_name) values ('Test')`);
  await asSuperuser(db, `
    insert into public.site_sections (key, content, visible) values
      ('hero', '{"a":1}', true), ('secret_section', '{"a":2}', false)
  `);
  await asSuperuser(db, `insert into public.section_media (section_key, slot, media_id) values ('secret_section', 'image', '${IDS.hiddenSectionMedia}')`);
  await asSuperuser(db, `
    insert into public.services (id, name, visible) values
      ('${IDS.visibleService}', '{"en":"Visible"}', true), ('${IDS.hiddenService}', '{"en":"Hidden"}', false)
  `);
  await asSuperuser(db, `
    insert into public.service_projects (service_id, project_id) values
      ('${IDS.visibleService}', '${IDS.published}'),
      ('${IDS.visibleService}', '${IDS.draft}'),
      ('${IDS.hiddenService}', '${IDS.published}')
  `);
  await asSuperuser(db, `insert into public.process_steps (title, visible) values ('{"en":"Shown"}', true), ('{"en":"Hidden"}', false)`);
  await asSuperuser(db, `insert into public.achievements (value, label, visible) values ('5', '{"en":"Shown"}', true), ('9', '{"en":"Hidden"}', false)`);
  await asSuperuser(db, `insert into public.social_links (label, url, visible) values ('Shown', 'https://a.test', true), ('Hidden', 'https://b.test', false)`);
  await asSuperuser(db, `insert into public.navigation_items (label, href, visible) values ('{"en":"Shown"}', '#a', true), ('{"en":"Hidden"}', '#b', false)`);
  await asSuperuser(db, `insert into storage.objects (bucket_id, name) values ('cms-images', 'projects/public.webp')`);
});

describe("migrations", () => {
  test("can safely run a second time without changing data", async () => {
    const before = await count(db, "public.projects");
    for (const file of migrationFiles()) {
      await db.exec(readFileSync(path.join(migrationsDir, file), "utf8"));
    }
    assert.equal(await count(db, "public.projects"), before);
    const buckets = await db.query("select id from storage.buckets order by id");
    assert.deepEqual(buckets.rows.map((row) => row.id), ["cms-images", "cms-videos"]);
  });

  test("every public table has row level security turned on", async () => {
    const { rows } = await db.query(`
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
    `);
    assert.deepEqual(rows, []);
  });
});

for (const [who, userId] of [["a visitor", null], ["a signed-in non-admin", STRANGER]]) {
  describe(`${who} reading`, () => {
    test("sees published projects only, never drafts", async () => {
      await as(db, userId, async () => {
        const { rows } = await db.query("select slug from public.projects");
        assert.deepEqual(rows.map((row) => row.slug), ["published-one"]);
      });
    });

    test("cannot reach a draft through its gallery, wall, SEO or service links", async () => {
      await as(db, userId, async () => {
        assert.equal(await count(db, `public.project_gallery where project_id = '${IDS.draft}'`), 0);
        assert.equal(await count(db, `public.wall_items where gallery_item_id = '${IDS.draftGallery}'`), 0);
        assert.equal(await count(db, `public.seo_metadata where project_id = '${IDS.draft}'`), 0);
        assert.equal(await count(db, `public.service_projects where project_id = '${IDS.draft}'`), 0);
        assert.equal(await count(db, `public.project_gallery where project_id = '${IDS.published}'`), 1);
      });
    });

    test("sees file details only for files that are in public use", async () => {
      await as(db, userId, async () => {
        const { rows } = await db.query("select id from public.media_assets");
        assert.deepEqual(rows.map((row) => row.id), [IDS.publicMedia]);
      });
    });

    test("cannot see hidden sections, services, steps, achievements or links", async () => {
      await as(db, userId, async () => {
        assert.equal(await count(db, "public.site_sections where key = 'secret_section'"), 0);
        assert.equal(await count(db, "public.section_media where section_key = 'secret_section'"), 0);
        assert.equal(await count(db, "public.services where not visible"), 0);
        assert.equal(await count(db, `public.service_projects where service_id = '${IDS.hiddenService}'`), 0);
        assert.equal(await count(db, "public.process_steps where not visible"), 0);
        assert.equal(await count(db, "public.achievements where not visible"), 0);
        assert.equal(await count(db, "public.social_links where not visible"), 0);
        assert.equal(await count(db, "public.navigation_items where not visible"), 0);
      });
    });

    test("can read the visible content the site needs", async () => {
      await as(db, userId, async () => {
        assert.equal(await count(db, "public.site_settings"), 1);
        assert.equal(await count(db, "public.site_sections where key = 'hero'"), 1);
        assert.equal(await count(db, "public.services where visible"), 1);
        assert.equal(await count(db, "public.seo_metadata where page_key = 'home'"), 1);
      });
    });

    test("cannot read the list of administrators", async () => {
      await as(db, userId, async () => {
        if (userId) {
          assert.equal(await count(db, "public.admin_users"), 0);
        } else {
          await rejects(db.query("select * from public.admin_users"), /permission denied/);
        }
      });
    });

    test("cannot list stored files", async () => {
      await as(db, userId, async () => {
        assert.equal(await count(db, "storage.objects"), 0);
      });
    });
  });

  describe(`${who} writing`, () => {
    const denied = userId ? /row-level security|Only administrators/ : /permission denied|row-level security/;

    test("cannot create, change or delete projects", async () => {
      await as(db, userId, () =>
        rejects(db.query(`insert into public.projects (slug, title) values ('hack', '{"en":"Hack"}')`), denied),
      );
      for (const sql of [`update public.projects set client = 'hacked'`, `delete from public.projects`]) {
        await as(db, userId, async () => {
          if (!userId) {
            await rejects(db.query(sql), denied);
            return;
          }
          // Row level security hides the rows: the statement runs but changes nothing.
          assert.equal((await db.query(sql)).affectedRows, 0);
        });
      }
    });

    test("cannot change settings, sections or media", async () => {
      for (const sql of [
        `update public.site_settings set site_name = 'hacked'`,
        `update public.site_sections set content = '{}'`,
        `update public.media_assets set original_name = 'hacked'`,
        `delete from public.media_assets`,
      ]) {
        await as(db, userId, async () => {
          if (!userId) {
            await rejects(db.query(sql), denied);
            return;
          }
          assert.equal((await db.query(sql)).affectedRows, 0, sql);
        });
      }
      await as(db, userId, () =>
        rejects(db.query(`insert into public.media_assets (bucket, path, mime_type, size_bytes) values ('cms-images', 'x', 'image/png', 1)`), denied),
      );
    });

    test("cannot make themselves an administrator", async () => {
      await as(db, userId, () =>
        rejects(db.query(`insert into public.admin_users (user_id, role) values ('${STRANGER}', 'owner')`), denied),
      );
    });

    test("cannot upload, replace or delete stored files", async () => {
      await as(db, userId, () =>
        rejects(db.query(`insert into storage.objects (bucket_id, name) values ('cms-images', 'hack.png')`), /row-level security/),
      );
      await as(db, userId, async () => {
        assert.equal((await db.query(`update storage.objects set name = 'hacked'`)).affectedRows, 0);
        assert.equal((await db.query(`delete from storage.objects`)).affectedRows, 0);
      });
    });

    test("cannot use the save, reorder or duplicate operations", async () => {
      const calls = [
        `select public.save_section('hero', '{}')`,
        `select public.reorder_rows('projects', array['${IDS.published}']::uuid[])`,
        `select public.reorder_sections(array['hero'])`,
        `select public.save_project(null, '{"slug":"x","title":{"en":"x"}}', null, null)`,
        `select public.duplicate_project('${IDS.published}')`,
        `select public.save_wall('[]')`,
        `select * from public.media_usage('${IDS.publicMedia}')`,
      ];
      for (const sql of calls) {
        await as(db, userId, () => rejects(db.query(sql), denied));
      }
    });
  });
}

describe("an administrator", () => {
  test("can read drafts and hidden content", async () => {
    await as(db, ADMIN, async () => {
      assert.equal(await count(db, "public.projects"), 2);
      assert.equal(await count(db, "public.site_sections where not visible"), 1);
      assert.equal(await count(db, "public.media_assets"), 4);
      assert.equal(await count(db, "storage.objects"), 1);
    });
  });

  test("can create, edit and delete content", async () => {
    await as(db, ADMIN, async () => {
      const created = await db.query(`insert into public.services (name) values ('{"en":"New"}') returning id`);
      await db.query(`update public.services set description = '{"ar":"وصف"}' where id = $1`, [created.rows[0].id]);
      const deleted = await db.query(`delete from public.services where id = $1`, [created.rows[0].id]);
      assert.equal(deleted.affectedRows, 1);
    });
  });

  test("can upload, replace and delete stored files, but only in the CMS buckets", async () => {
    await as(db, ADMIN, async () => {
      await db.query(`insert into storage.objects (bucket_id, name) values ('cms-images', 'new.png')`);
      assert.equal((await db.query(`update storage.objects set name = 'renamed.png' where name = 'new.png'`)).affectedRows, 1);
      assert.equal((await db.query(`delete from storage.objects where name = 'renamed.png'`)).affectedRows, 1);
    });
    await as(db, ADMIN, () =>
      rejects(db.query(`insert into storage.objects (bucket_id, name) values ('someone-elses-bucket', 'x.png')`), /row-level security|foreign key/),
    );
  });

  test("cannot grant admin rights unless they are an owner", async () => {
    await as(db, ADMIN, () =>
      rejects(db.query(`insert into public.admin_users (user_id) values ('${STRANGER}')`), /row-level security/),
    );
    await as(db, OWNER, async () => {
      const inserted = await db.query(`insert into public.admin_users (user_id) values ('${STRANGER}')`);
      assert.equal(inserted.affectedRows, 1);
    });
  });
});

describe("data safety", () => {
  test("a file in use cannot be deleted, even by an administrator", async () => {
    await as(db, ADMIN, () =>
      rejects(db.query(`delete from public.media_assets where id = '${IDS.publicMedia}'`), /foreign key/),
    );
    await as(db, ADMIN, async () => {
      assert.equal((await db.query(`delete from public.media_assets where id = '${IDS.unusedMedia}'`)).affectedRows, 1);
    });
  });

  test("the usage report names every place a file is used", async () => {
    await as(db, ADMIN, async () => {
      const { rows } = await db.query(`select area, label, href from public.media_usage('${IDS.publicMedia}') order by area`);
      assert.deepEqual(rows.map((row) => row.area), ["Project cover", "Project gallery"]);
      assert.equal(rows[0].label, "Published");
      assert.equal(rows[0].href, `/admin/projects/${IDS.published}`);

      const counts = await db.query(`select media_id, uses from public.media_usage_counts(array['${IDS.publicMedia}', '${IDS.unusedMedia}']::uuid[])`);
      assert.equal(counts.rows.length, 1);
      assert.equal(counts.rows[0].media_id, IDS.publicMedia);
      assert.equal(Number(counts.rows[0].uses), 2);
    });
  });

  test("a category in use cannot be deleted", async () => {
    await as(db, ADMIN, () =>
      rejects(db.query(`delete from public.project_categories where id = '${IDS.category}'`), /foreign key/),
    );
  });

  test("a project cannot be published without a cover", async () => {
    await as(db, ADMIN, () =>
      rejects(
        db.query(`insert into public.projects (slug, title, status) values ('no-cover', '{"en":"x"}', 'published')`),
        /projects_published_needs_cover/,
      ),
    );
  });

  test("bad values are refused", async () => {
    const bad = [
      `insert into public.projects (slug, title) values ('Not A Slug', '{"en":"x"}')`,
      `insert into public.projects (slug, title) values ('ok-slug', '{"ar":"no english"}')`,
      `insert into public.projects (slug, title) values ('ok-slug', '{"fr":"wrong language","en":"x"}')`,
      `insert into public.projects (slug, title, behance_url) values ('ok-slug', '{"en":"x"}', 'javascript:alert(1)')`,
      `insert into public.navigation_items (label, href) values ('{"en":"x"}', 'javascript:alert(1)')`,
      `insert into public.social_links (label, url) values ('x', 'javascript:alert(1)')`,
    ];
    for (const sql of bad) {
      await as(db, ADMIN, () => rejects(db.query(sql), /check constraint/));
    }
  });
});

describe("operations", () => {
  const projectJson = (overrides = {}) =>
    JSON.stringify({ slug: "from-rpc", title: { en: "From RPC", ar: "عنوان" }, tile: "wide", tools: ["Canva"], ...overrides });

  test("save_project creates a project with its gallery and SEO, then updates it", async () => {
    await as(db, ADMIN, async () => {
      const gallery = JSON.stringify([
        { media_id: IDS.publicMedia, caption: { en: "One" }, deck_position: 1 },
        { media_id: IDS.draftMedia },
      ]);
      const seo = JSON.stringify({ title: { en: "SEO title" }, noindex: true });
      const created = await db.query("select public.save_project(null, $1, $2, $3) as id", [projectJson(), gallery, seo]);
      const id = created.rows[0].id;

      const project = (await db.query("select * from public.projects where id = $1", [id])).rows[0];
      assert.equal(project.status, "draft");
      assert.equal(project.tile, "wide");
      assert.deepEqual(project.tools, ["Canva"]);
      assert.equal(await count(db, `public.project_gallery where project_id = '${id}'`), 2);
      assert.equal((await db.query("select noindex from public.seo_metadata where project_id = $1", [id])).rows[0].noindex, true);

      const before = (await db.query("select id, media_id from public.project_gallery where project_id = $1 and media_id = $2", [id, IDS.publicMedia])).rows[0].id;

      // Reversed order, one page removed, deck position moved. The kept row keeps its id.
      await db.query("select public.save_project($1, $2, $3, null)", [
        id,
        projectJson({ short_name: "Short" }),
        JSON.stringify([{ media_id: IDS.publicMedia, deck_position: 2 }]),
      ]);
      const after = (await db.query("select * from public.project_gallery where project_id = $1", [id])).rows;
      assert.equal(after.length, 1);
      assert.equal(after[0].id, before);
      assert.equal(after[0].deck_position, 2);
      assert.equal((await db.query("select short_name from public.projects where id = $1", [id])).rows[0].short_name, "Short");
    });
  });

  test("publishing records the date, and a duplicate slug is refused", async () => {
    await as(db, ADMIN, async () => {
      const created = await db.query("select public.save_project(null, $1, null, null) as id", [
        projectJson({ status: "published", cover_media_id: IDS.publicMedia }),
      ]);
      const project = (await db.query("select published_at from public.projects where id = $1", [created.rows[0].id])).rows[0];
      assert.ok(project.published_at);
    });
    await as(db, ADMIN, () =>
      rejects(db.query("select public.save_project(null, $1, null, null)", [projectJson({ slug: "published-one" })]), /duplicate key/),
    );
  });

  test("duplicate_project makes a draft copy with its gallery and SEO", async () => {
    await as(db, ADMIN, async () => {
      const first = (await db.query(`select public.duplicate_project('${IDS.published}') as id`)).rows[0].id;
      const second = (await db.query(`select public.duplicate_project('${IDS.published}') as id`)).rows[0].id;
      const rows = (await db.query("select id, slug, status, featured, title from public.projects where id = any($1::uuid[]) order by slug", [[first, second]])).rows;
      assert.deepEqual(rows.map((row) => row.slug), ["published-one-copy", "published-one-copy-2"]);
      assert.ok(rows.every((row) => row.status === "draft" && row.featured === false));
      assert.equal(rows[0].title.en, "Published (copy)");
      assert.equal(await count(db, `public.project_gallery where project_id = '${first}'`), 1);
      assert.equal(await count(db, `public.seo_metadata where project_id = '${first}'`), 1);
    });
  });

  test("reorder_rows sets the order and refuses unknown lists", async () => {
    await as(db, ADMIN, async () => {
      await db.query(`select public.reorder_rows('projects', array['${IDS.draft}', '${IDS.published}']::uuid[])`);
      const { rows } = await db.query("select slug from public.projects order by display_order");
      assert.deepEqual(rows.map((row) => row.slug), ["secret-draft", "published-one"]);
    });
    await as(db, ADMIN, () =>
      rejects(db.query(`select public.reorder_rows('admin_users', array['${IDS.draft}']::uuid[])`), /cannot be reordered/),
    );
  });

  test("save_section replaces a section's content and images together", async () => {
    await as(db, ADMIN, async () => {
      await db.query("select public.save_section('hero', $1, $2)", [
        JSON.stringify({ headline: { en: "New" } }),
        JSON.stringify([{ slot: "portrait", position: 0, media_id: IDS.publicMedia }]),
      ]);
      assert.equal((await db.query("select content from public.site_sections where key = 'hero'")).rows[0].content.headline.en, "New");
      assert.equal(await count(db, "public.section_media where section_key = 'hero' and slot = 'portrait'"), 1);
      assert.equal((await db.query("select visible from public.site_sections where key = 'hero'")).rows[0].visible, true);
    });
  });

  test("a bad image in save_section leaves the old content untouched", async () => {
    await as(db, ADMIN, async () => {
      await db.exec("savepoint before_bad_save");
      await rejects(
        db.query("select public.save_section('hero', $1, $2)", [
          JSON.stringify({ headline: { en: "Broken" } }),
          JSON.stringify([{ slot: "portrait", position: 0, media_id: "99999999-0000-4000-8000-000000000000" }]),
        ]),
        /foreign key/,
      );
      await db.exec("rollback to savepoint before_bad_save");
      assert.deepEqual((await db.query("select content from public.site_sections where key = 'hero'")).rows[0].content, { a: 1 });
    });
  });

  test("save_wall replaces the homepage wall in order", async () => {
    await as(db, ADMIN, async () => {
      await db.query("select public.save_wall($1)", [
        JSON.stringify([
          { gallery_item_id: IDS.draftGallery, row_index: 1 },
          { gallery_item_id: IDS.publishedGallery, row_index: 0 },
        ]),
      ]);
      const { rows } = await db.query("select gallery_item_id, row_index, display_order from public.wall_items order by display_order");
      assert.deepEqual(rows, [
        { gallery_item_id: IDS.draftGallery, row_index: 1, display_order: 0 },
        { gallery_item_id: IDS.publishedGallery, row_index: 0, display_order: 1 },
      ]);
    });
  });
});

describe("starting permissions", () => {
  const OPERATIONS = ["assert_admin", "is_admin", "is_owner", "save_section", "reorder_rows", "reorder_sections", "save_project", "duplicate_project", "save_wall", "media_usage", "media_usage_counts"];

  test("visitors cannot run any save or admin operation", async () => {
    const { rows } = await db.query(
      `select p.proname, has_function_privilege('anon', p.oid, 'EXECUTE') as allowed
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = any($1)`,
      [OPERATIONS],
    );
    assert.equal(rows.length, OPERATIONS.length);
    assert.deepEqual(rows.filter((row) => row.allowed).map((row) => row.proname), []);
  });

  test("visitors have read-only access to content tables, whatever the platform's defaults are", async () => {
    const { rows } = await db.query(
      `select table_name,
              has_table_privilege('anon', 'public.' || table_name, 'INSERT') as can_insert,
              has_table_privilege('anon', 'public.' || table_name, 'UPDATE') as can_update,
              has_table_privilege('anon', 'public.' || table_name, 'DELETE') as can_delete
       from information_schema.tables where table_schema = 'public'`,
    );
    assert.ok(rows.length >= 16);
    assert.deepEqual(rows.filter((row) => row.can_insert || row.can_update || row.can_delete).map((row) => row.table_name), []);
  });

  test("visitors cannot touch the administrators table at all", async () => {
    const { rows } = await db.query(`select has_table_privilege('anon', 'public.admin_users', 'SELECT') as can_read`);
    assert.equal(rows[0].can_read, false);
  });

  test("every table has Row Level Security switched on", async () => {
    const { rows } = await db.query(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    );
    assert.deepEqual(rows, []);
  });
});

describe("saving a project keeps what its form does not show", () => {
  test("the Behance project id survives an edit", async () => {
    await asSuperuser(db, `update public.projects set behance_id = '12345' where id = '${IDS.published}'`);
    await as(db, ADMIN, async (client) => {
      const { rows } = await client.query(`select to_jsonb(p) as row from public.projects p where id = '${IDS.published}'`);
      const project = { ...rows[0].row };
      delete project.behance_id;
      await client.query(`select public.save_project($1, $2::jsonb, null, null)`, [IDS.published, JSON.stringify(project)]);
      const after = await client.query(`select behance_id from public.projects where id = '${IDS.published}'`);
      assert.equal(after.rows[0].behance_id, "12345");
    });
  });
});
