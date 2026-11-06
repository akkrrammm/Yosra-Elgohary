// Keeps the starting content and the dashboard's forms in step, because a form only
// saves the fields it defines: anything undefined would silently vanish on first save.
// Run with: npm run test:unit
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { COLLECTIONS, PROJECT_FIELDSETS, SECTIONS, SEO_FIELDSETS, SETTINGS_GROUPS } from "../../lib/cms/definitions";
import { emptyValues, flattenFields, missingArabic, sanitizeFields, slugify, validateFields } from "../../lib/cms/fields";
import { buildSeed, stableId } from "../../lib/cms/seed";

const seed = buildSeed();
const mediaIds = new Set(seed.media.map((item) => item.id));

describe("starting content and forms", () => {
  for (const section of seed.sections) {
    test(`section "${section.key}" has a form field for everything it stores`, () => {
      const definition = SECTIONS[section.key as keyof typeof SECTIONS];
      assert.ok(definition, `no definition for section ${section.key}`);
      const defined = new Set(flattenFields(definition.fieldsets).map((field) => field.key));
      for (const key of Object.keys(section.content)) assert.ok(defined.has(key), `${section.key}.${key} would be lost on save`);
    });

    test(`section "${section.key}" passes its own validation`, () => {
      const fields = flattenFields(SECTIONS[section.key as keyof typeof SECTIONS].fieldsets);
      const values = { ...emptyValues(fields), ...section.content };
      for (const field of fields) {
        if (field.type === "media") values[field.key] = field.multiple ? [] : { id: "x" };
      }
      assert.deepEqual(validateFields(fields, values), {});
    });
  }

  test("saving a section unchanged keeps every value", () => {
    const hero = seed.sections.find((section) => section.key === "hero")!;
    const fields = flattenFields(SECTIONS.hero.fieldsets).filter((field) => field.type !== "media");
    assert.deepEqual(sanitizeFields(fields, hero.content), hero.content);
  });

  test("every project passes the project form's validation", () => {
    const categories = seed.categories.map((category) => ({ value: category.id, label: category.slug }));
    const fields = flattenFields(Object.values(PROJECT_FIELDSETS(categories)));
    for (const project of seed.projects) {
      const values = {
        ...emptyValues(fields),
        ...project,
        cover_media_id: { id: project.cover_media_id },
        video_media_id: null,
        client: project.client ?? "",
        behance_url: project.behance_url ?? "",
        cover_background: project.cover_background ?? "",
        category_id: project.category_id ?? "",
      };
      assert.deepEqual(validateFields(fields, values), {}, project.slug);
    }
  });

  test("every service, step, number, category, link and menu item passes its form", () => {
    const check = (definition: { fields: Parameters<typeof validateFields>[0] }, rows: Record<string, unknown>[]) => {
      for (const row of rows) assert.deepEqual(validateFields(definition.fields, row as never), {}, JSON.stringify(row));
    };
    check(COLLECTIONS.services, seed.services);
    check(COLLECTIONS.process_steps, seed.steps);
    check(COLLECTIONS.achievements, seed.achievements);
    check(COLLECTIONS.project_categories, seed.categories);
    check(COLLECTIONS.social_links, seed.socials);
    check(COLLECTIONS.nav_header, seed.navigation);
  });

  test("the settings and SEO content pass their forms", () => {
    const settings = seed.settings!;
    for (const group of Object.values(SETTINGS_GROUPS)) {
      const fields = flattenFields(group.fieldsets);
      const values = { ...emptyValues(fields), ...settings } as Record<string, unknown>;
      for (const field of fields) if (values[field.key] === null) values[field.key] = field.type === "media" ? null : "";
      assert.deepEqual(validateFields(fields, values), {}, group.title);
    }
    const seoFields = flattenFields(SEO_FIELDSETS);
    for (const row of seed.seo) {
      assert.deepEqual(validateFields(seoFields, { ...row, canonical_url: "" } as never), {}, row.page_key ?? String(row.project_id));
    }
  });
});

describe("starting content references", () => {
  test("nothing refers to a file that is not in the media list", () => {
    const references = [
      ...seed.sectionMedia.map((row) => row.media_id),
      ...seed.projects.map((row) => row.cover_media_id),
      ...seed.gallery.map((row) => row.media_id),
      ...seed.seo.map((row) => row.og_media_id),
      seed.settings!.logo_mark_media_id,
      seed.settings!.logo_lockup_media_id,
      seed.settings!.favicon_media_id,
      seed.settings!.default_profile_media_id,
      seed.settings!.default_og_media_id,
    ];
    for (const id of references) if (id) assert.ok(mediaIds.has(id), id);
  });

  test("every wall page points to a real gallery item", () => {
    const gallery = new Set(seed.gallery.map((row) => row.id));
    assert.equal(seed.wall.length, 12);
    for (const row of seed.wall) assert.ok(gallery.has(row.gallery_item_id));
  });

  test("the nine Behance projects are all there and published", () => {
    assert.equal(seed.projects.length, 9);
    assert.ok(seed.projects.every((project) => project.status === "published" && project.behance_url && project.cover_media_id));
    assert.equal(new Set(seed.projects.map((project) => project.slug)).size, 9);
  });

  test("the numbers are counted from the work", () => {
    assert.deepEqual(seed.achievements.map((row) => row.value), ["6", "110", "18", "3"]);
  });

  test("ids are stable, so running the seed twice cannot create duplicates", () => {
    assert.equal(stableId("project:x"), stableId("project:x"));
    assert.notEqual(stableId("project:x"), stableId("project:y"));
    assert.match(stableId("project:x"), /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    const again = buildSeed();
    assert.deepEqual(again.projects.map((row) => row.id), seed.projects.map((row) => row.id));
    assert.deepEqual(again.media.map((row) => row.id), seed.media.map((row) => row.id));
  });
});

describe("form rules", () => {
  const fields = [
    { key: "title", label: "Title", type: "text", localized: true, required: true, max: 5 },
    { key: "href", label: "Link", type: "link" },
    { key: "url", label: "Address", type: "url" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "phone" },
    { key: "slug", label: "Slug", type: "slug" },
    { key: "color", label: "Color", type: "color" },
  ] as const;
  const valid = { title: { en: "ok" }, href: "#about", url: "https://a.test", email: "a@b.co", phone: "+20 100 123 4567", slug: "a-b", color: "#17151F" };

  test("accepts valid values", () => {
    assert.deepEqual(validateFields([...fields], valid), {});
  });

  test("English is required, but a missing Arabic translation is not an error", () => {
    assert.ok(validateFields([...fields], { ...valid, title: { ar: "عربي" } }).title);
    assert.equal(validateFields([...fields], { ...valid, title: { en: "ok" } }).title, undefined);
  });

  test("refuses text over the limit in either language", () => {
    assert.ok(validateFields([...fields], { ...valid, title: { en: "too long" } }).title);
    assert.ok(validateFields([...fields], { ...valid, title: { en: "ok", ar: "طويل جدًا جدًا" } }).title);
  });

  test("refuses dangerous or malformed links", () => {
    for (const href of ["javascript:alert(1)", "data:text/html,x", "about", "http//x"]) {
      assert.ok(validateFields([...fields], { ...valid, href }).href, href);
    }
    assert.ok(validateFields([...fields], { ...valid, url: "javascript:alert(1)" }).url);
    for (const href of ["#contact", "/work/x", "https://a.test/b", "mailto:a@b.co", "tel:+201001234567"]) {
      assert.equal(validateFields([...fields], { ...valid, href }).href, undefined, href);
    }
  });

  test("refuses bad emails, phones, slugs and colors", () => {
    assert.ok(validateFields([...fields], { ...valid, email: "nope" }).email);
    assert.ok(validateFields([...fields], { ...valid, phone: "call me" }).phone);
    assert.ok(validateFields([...fields], { ...valid, slug: "Not A Slug" }).slug);
    assert.ok(validateFields([...fields], { ...valid, color: "red" }).color);
  });

  test("cleaning keeps only known fields and never copies one language over the other", () => {
    const clean = sanitizeFields([{ key: "title", label: "Title", type: "text", localized: true }], {
      title: { en: "  Hello  ", ar: "   " },
      injected: "drop me",
    });
    assert.deepEqual(clean, { title: { en: "Hello" } });
  });

  test("errors inside repeating rows name the exact row", () => {
    const errors = validateFields(
      [{ key: "rows", label: "Rows", type: "list", itemLabel: "Row", fields: [{ key: "name", label: "Name", type: "text", required: true }] }],
      { rows: [{ name: "ok" }, { name: "" }] },
    );
    assert.deepEqual(Object.keys(errors), ["rows.1.name"]);
  });

  test("reminders list missing Arabic but skip fields that are fine in one language", () => {
    const missing = missingArabic(
      [
        { key: "a", label: "Needs Arabic", type: "text", localized: true },
        { key: "b", label: "Name", type: "text", localized: true, arabicOptional: true },
      ],
      { a: { en: "x" }, b: { en: "y" } },
    );
    assert.deepEqual(missing, ["Needs Arabic"]);
  });

  test("slugify makes web addresses from titles", () => {
    assert.equal(slugify("AI-Powered Teaser | Spark by Hilton!"), "ai-powered-teaser-spark-by-hilton");
    assert.equal(slugify("  Two   Words  "), "two-words");
  });
});
