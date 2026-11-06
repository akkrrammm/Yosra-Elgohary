import { createHash } from "node:crypto";
import type { Locale } from "@/lib/i18n";
import type {
  LocalizedList,
  LocalizedText,
  MediaBucket,
  MediaFolder,
  MediaKind,
  MediaRow,
  ProjectRow,
  SettingsRow,
} from "@/lib/supabase/database.types";
import { type Dictionary, getDictionary } from "@/supabase/seed-content/dictionary";
import { categories, projects, wallPages, type Project } from "@/supabase/seed-content/projects";
import { services } from "@/supabase/seed-content/services";
import { site } from "@/supabase/seed-content/site";
import type { CmsSnapshot, MediaRecord } from "./types";

/**
 * Turns the site's original content into database rows. The seed script writes these
 * to Supabase, and the site renders them directly until Supabase is connected, so
 * there is only one description of the starting content.
 */

const EPOCH = "2026-11-05T00:00:00.000Z";
const timestamps = { created_at: EPOCH, updated_at: EPOCH };

/** The same key always gives the same id, so running the seed twice cannot create duplicates. */
export function stableId(key: string) {
  const hash = createHash("sha1").update(`yosra-cms:${key}`).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `${((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16)}${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

export type SeedMedia = MediaRecord & { localFile: string };

function createMediaIndex() {
  const byId = new Map<string, SeedMedia>();

  /** `local` is the path inside public/, `storagePath` is where the file goes in the bucket. */
  const add = (input: {
    local: string;
    storagePath: string;
    folder: MediaFolder;
    width: number;
    height: number;
    alt?: LocalizedText;
    bucket?: MediaBucket;
    kind?: MediaKind;
  }) => {
    const id = stableId(`media:${input.storagePath}`);
    const existing = byId.get(id);
    if (existing) {
      if (input.alt && Object.keys(existing.alt).length === 0) existing.alt = input.alt;
      return id;
    }
    const extension = input.local.split(".").pop() ?? "";
    const mime: Record<string, string> = {
      webp: "image/webp",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
    };
    const row: MediaRow = {
      id,
      bucket: input.bucket ?? "cms-images",
      path: input.storagePath,
      kind: input.kind ?? "image",
      folder: input.folder,
      mime_type: mime[extension] ?? "application/octet-stream",
      size_bytes: 0,
      width: input.width,
      height: input.height,
      // Project files share names like 01.webp, so the project's name tells them apart in the library.
      original_name: input.local.startsWith("/work/") ? input.local.replace("/work/", "").replaceAll("/", "-") : (input.local.split("/").pop() ?? ""),
      alt: input.alt ?? {},
      uploaded_by: null,
      ...timestamps,
    };
    byId.set(id, { ...row, url: input.local, localFile: input.local });
    return id;
  };

  return { add, all: () => [...byId.values()] };
}

/** Project images keep their public/work/<slug>/<file> layout inside the bucket. */
const projectStoragePath = (local: string) => local.replace(/^\/work\//, "projects/");

export type Seed = Omit<CmsSnapshot, "media" | "settings"> & { media: SeedMedia[]; settings: SettingsRow };

export function buildSeed(): Seed {
  const en = getDictionary("en");
  const ar = getDictionary("ar");
  const both = (pick: (t: Dictionary) => string): LocalizedText => ({ en: pick(en), ar: pick(ar) });
  const zip = (a: readonly string[], b: readonly string[]) => a.map((text, index) => ({ text: { en: text, ar: b[index] } }));

  const media = createMediaIndex();

  /* ------------------------------- brand ------------------------------- */

  const logoMark = media.add({
    local: "/brand/logo-mark.png",
    storagePath: "logo/logo-mark.png",
    folder: "logo",
    width: 643,
    height: 676,
    alt: { en: `${site.name} logo mark`, ar: `شعار ${site.name}` },
  });
  const logoLockup = media.add({
    local: "/brand/logo-lockup.png",
    storagePath: "logo/logo-lockup.png",
    folder: "logo",
    width: 682,
    height: 973,
    alt: both((t) => t.footer.logoAlt),
  });
  const favicon = media.add({ local: "/brand/icon.png", storagePath: "logo/icon.png", folder: "logo", width: 512, height: 512 });
  const defaultOg = media.add({ local: "/og.jpg", storagePath: "other/og.jpg", folder: "other", width: 1200, height: 630 });

  const portrait = (key: keyof typeof site.portraits) => {
    const { src, width, height, alt } = site.portraits[key];
    return media.add({
      local: src,
      storagePath: `profile/${src.split("/").pop()}`,
      folder: "profile",
      width,
      height,
      alt,
    });
  };
  const heroPortrait = portrait("hero");
  const aboutPortrait = portrait("about");
  const processPortrait = portrait("process");
  const contactPortrait = portrait("contact");

  /* ------------------------------ sections ------------------------------ */

  const section = (key: string, display_order: number, content: Record<string, unknown>) => ({
    key,
    content: content as CmsSnapshot["sections"][number]["content"],
    visible: true,
    display_order,
    ...timestamps,
  });

  const sections: CmsSnapshot["sections"] = [
    section("hero", 0, {
      first_name: { en: "Yosra" },
      last_name: { en: "Elgohary" },
      kicker: both((t) => t.hero.kicker),
      available_text: both((t) => t.hero.available),
      headline_a: both((t) => t.hero.headlineA),
      headline_b: both((t) => t.hero.headlineB),
      intro: both((t) => t.hero.intro),
      primary_label: both((t) => t.hero.primary),
      primary_href: "#work",
      secondary_label: both((t) => t.hero.secondary),
      secondary_href: "#contact",
      seal_text: "BRANDING / CONTENT / AI /",
      show_seal: true,
    }),
    section("ribbon", 1, {
      items: [...zip(en.hero.ribbon, ar.hero.ribbon), ...site.brands.map((brand) => ({ text: { en: brand } }))],
    }),
    section("about", 2, {
      label: both((t) => t.about.label),
      statement: both((t) => t.about.statement),
      lead: both((t) => t.about.lead),
      principles_title: both((t) => t.about.principlesTitle),
      principles: en.about.principles.map((principle, index) => ({
        title: { en: principle.title, ar: ar.about.principles[index].title },
        text: { en: principle.text, ar: ar.about.principles[index].text },
      })),
      facts: [
        { label: both((t) => t.about.facts.location), value: site.location },
        { label: both((t) => t.about.facts.focus), value: both((t) => t.about.facts.focusValue) },
        { label: both((t) => t.about.facts.availability), value: both((t) => t.about.facts.availabilityValue) },
        { label: both((t) => t.about.facts.tools), value: { en: site.tools.join(" · "), ar: site.tools.join(" · ") } },
      ],
    }),
    section("services", 3, {
      label: both((t) => t.services.label),
      title: both((t) => t.services.title),
      seen_in: both((t) => t.services.seenIn),
    }),
    section("work", 4, {
      title_a: both((t) => t.work.titleA),
      title_b: both((t) => t.work.titleB),
      lead: both((t) => t.work.lead),
      filter_label: both((t) => t.work.filterLabel),
      all_label: both((t) => t.work.all),
      playlist_title: both((t) => t.work.playlistTitle),
      wall_title: both((t) => t.work.wallTitle),
      view_label: both((t) => t.work.view),
      open_label: both((t) => t.work.open),
      video_label: both((t) => t.project.video),
      featured_label: both((t) => t.project.featured),
      show_wall: true,
    }),
    section("process", 5, {
      label: both((t) => t.process.label),
      title: both((t) => t.process.title),
      lead: both((t) => t.process.lead),
    }),
    section("achievements", 6, {
      title: both((t) => t.counted.title),
      note: both((t) => t.counted.note),
    }),
    section("contact", 7, {
      label: both((t) => t.contact.label),
      headline_a: both((t) => t.contact.headlineA),
      headline_b: both((t) => t.contact.headlineB),
      text: both((t) => t.contact.text),
      primary_label: both((t) => t.contact.primary),
      primary_href: site.behanceUrl,
      secondary_label: both((t) => t.contact.secondary),
      secondary_href: site.linkedinUrl,
      elsewhere_label: both((t) => t.contact.elsewhere),
      location_label: both((t) => t.contact.location),
      phone_label: both((t) => t.contact.phone),
      whatsapp_label: { en: "WhatsApp", ar: "واتساب" },
    }),
    section("navigation", 20, {
      cta_label: both((t) => t.nav.cta),
      cta_href: "#contact",
      menu_label: both((t) => t.nav.menu),
      close_label: both((t) => t.nav.close),
      skip_label: both((t) => t.nav.skip),
      home_label: both((t) => t.nav.home),
      main_label: both((t) => t.nav.main),
      footer_label: both((t) => t.nav.footer),
    }),
    section("footer", 21, {
      rights: both((t) => t.footer.rights),
      top_label: both((t) => t.footer.top),
      logo_alt: both((t) => t.footer.logoAlt),
    }),
    section("labels", 22, {
      back: both((t) => t.project.back),
      client: both((t) => t.project.client),
      role: both((t) => t.project.role),
      tools: both((t) => t.project.tools),
      deliverables: both((t) => t.project.deliverables),
      overview: { en: "Overview", ar: "نظرة عامة" },
      context: both((t) => t.project.context),
      objective: both((t) => t.project.objective),
      direction: both((t) => t.project.direction),
      content_strategy: both((t) => t.project.contentStrategy),
      palette: both((t) => t.project.palette),
      system: both((t) => t.project.system),
      gallery: both((t) => t.project.gallery),
      related_visuals: both((t) => t.project.relatedVisuals),
      view_on_behance: both((t) => t.project.viewOnBehance),
      watch_on_behance: both((t) => t.project.watchOnBehance),
      next: both((t) => t.project.next),
      draft_badge: { en: "Draft preview", ar: "معاينة مسودة" },
      lightbox_label: both((t) => t.project.lightbox.label),
      lightbox_close: both((t) => t.project.lightbox.close),
      lightbox_prev: both((t) => t.project.lightbox.prev),
      lightbox_next: both((t) => t.project.lightbox.next),
      lightbox_open: both((t) => t.project.lightbox.open),
      lightbox_of: both((t) => t.project.lightbox.of),
      not_found_title: { en: "This page isn't here.", ar: "هذه الصفحة غير موجودة." },
      not_found_text: {
        en: "The link may be old, or the address may have a typo.",
        ar: "ربما يكون الرابط قديمًا أو يحتوي العنوان على خطأ.",
      },
      not_found_back: { en: "Back to the portfolio", ar: "العودة إلى الموقع" },
    }),
  ];

  const sectionMedia: CmsSnapshot["sectionMedia"] = [
    { section_key: "hero", slot: "portrait", position: 0, media_id: heroPortrait },
    { section_key: "about", slot: "portrait", position: 0, media_id: aboutPortrait },
    { section_key: "process", slot: "portrait", position: 0, media_id: processPortrait },
    { section_key: "contact", slot: "portrait", position: 0, media_id: contactPortrait },
  ];

  /* ------------------------------ projects ------------------------------ */

  const categoryRows: CmsSnapshot["categories"] = Object.entries(categories).map(([slug, name], display_order) => ({
    id: stableId(`category:${slug}`),
    slug,
    name,
    visible: true,
    display_order,
    ...timestamps,
  }));

  const projectMedia = (image: Project["coverImage"]) =>
    media.add({
      local: image.src,
      storagePath: projectStoragePath(image.src),
      folder: "projects",
      width: image.width,
      height: image.height,
      alt: image.alt,
    });

  const projectRows: ProjectRow[] = [];
  const galleryRows: CmsSnapshot["gallery"] = [];
  const seoRows: CmsSnapshot["seo"] = [];

  const seoRow = (values: Partial<CmsSnapshot["seo"][number]> & { key: string }): CmsSnapshot["seo"][number] => {
    const { key, ...rest } = values;
    return {
      id: stableId(`seo:${key}`),
      page_key: null,
      project_id: null,
      title: {},
      description: {},
      og_title: {},
      og_description: {},
      og_media_id: null,
      twitter_title: {},
      twitter_description: {},
      twitter_card: "summary_large_image",
      canonical_url: null,
      noindex: false,
      ...timestamps,
      ...rest,
    };
  };

  for (const project of [...projects].sort((a, b) => a.displayOrder - b.displayOrder)) {
    const id = stableId(`project:${project.slug}`);
    const study = project.caseStudy;

    projectRows.push({
      id,
      behance_id: project.id,
      slug: project.slug,
      title: { en: project.title },
      short_name: project.shortName,
      short_description: project.description,
      full_description: {},
      category_id: stableId(`category:${project.category}`),
      client: project.client ?? null,
      cover_media_id: projectMedia(project.coverImage),
      cover_background: project.coverBackground ?? null,
      context: study?.context ?? {},
      objective: study?.objective ?? {},
      direction: study?.direction ?? {},
      strategy: study?.contentStrategy ?? {},
      quote: study?.quote ? { en: study.quote } : {},
      highlights: study?.highlights ?? [],
      palette: study?.palette ?? [],
      role: (project.role ?? {}) as LocalizedList,
      deliverables: (project.deliverables ?? {}) as LocalizedList,
      tools: project.tools,
      is_video: Boolean(project.video),
      video_media_id: null,
      tile: project.tile,
      behance_url: project.behanceUrl,
      featured: project.featured,
      status: "published",
      display_order: project.displayOrder - 1,
      published_at: EPOCH,
      ...timestamps,
    });

    project.gallery.forEach((image, display_order) => {
      const deckIndex = project.deckPages?.indexOf(display_order) ?? -1;
      galleryRows.push({
        id: stableId(`gallery:${project.slug}:${image.src}`),
        project_id: id,
        media_id: projectMedia(image),
        caption: image.caption ?? {},
        display_order,
        deck_position: deckIndex >= 0 ? deckIndex + 1 : null,
        created_at: EPOCH,
      });
    });

    seoRows.push(
      seoRow({
        key: `project:${project.slug}`,
        project_id: id,
        og_media_id: media.add({
          local: `/og/${project.slug}.jpg`,
          storagePath: `other/og/${project.slug}.jpg`,
          folder: "other",
          width: 1200,
          height: 630,
        }),
      }),
    );
  }

  const wallRows: CmsSnapshot["wall"] = wallPages.flatMap((row, row_index) =>
    row.map(({ slug, file }, display_order) => ({
      id: stableId(`wall:${slug}:${file}`),
      gallery_item_id: stableId(`gallery:${slug}:/work/${slug}/${file}.webp`),
      row_index,
      display_order,
    })),
  );

  /* ------------------------------ services ------------------------------ */

  const serviceRows: CmsSnapshot["services"] = services.map((service, display_order) => ({
    id: stableId(`service:${service.id}`),
    name: service.name,
    description: service.description,
    icon: null,
    image_media_id: null,
    visible: service.visible,
    display_order,
    ...timestamps,
  }));

  const serviceProjects: CmsSnapshot["serviceProjects"] = services.flatMap((service) =>
    service.proof.map((slug, display_order) => ({
      service_id: stableId(`service:${service.id}`),
      project_id: stableId(`project:${slug}`),
      display_order,
    })),
  );

  const steps: CmsSnapshot["steps"] = en.process.steps.map((step, display_order) => ({
    id: stableId(`step:${display_order}`),
    title: { en: step.title, ar: ar.process.steps[display_order].title },
    description: { en: step.text, ar: ar.process.steps[display_order].text },
    icon: null,
    image_media_id: null,
    visible: true,
    display_order,
    ...timestamps,
  }));

  /* ---------------------------- achievements ---------------------------- */

  // Counted from the published work, never estimated.
  const sum = (key: "profilePages" | "guidelineSlides") => projects.reduce((total, p) => total + (p.counts?.[key] ?? 0), 0);
  const achievements: CmsSnapshot["achievements"] = [
    { key: "videos", value: projects.filter((p) => p.video).length, label: both((t) => t.counted.videos) },
    { key: "profile-pages", value: sum("profilePages"), label: both((t) => t.counted.profilePages) },
    { key: "guideline-slides", value: sum("guidelineSlides"), label: both((t) => t.counted.guidelineSlides) },
    {
      key: "brands",
      value: new Set(projects.map((p) => p.client).filter(Boolean)).size,
      label: both((t) => t.counted.brands),
    },
  ].map(({ key, value, label }, display_order) => ({
    id: stableId(`achievement:${key}`),
    value: String(value),
    label,
    visible: true,
    display_order,
    ...timestamps,
  }));

  /* -------------------------------- links ------------------------------- */

  const socials: CmsSnapshot["socials"] = site.socials.map((social, display_order) => ({
    id: stableId(`social:${social.label}`),
    label: social.label,
    url: social.url,
    icon: null,
    visible: true,
    display_order,
    ...timestamps,
  }));

  const navLinks: { id: string; label: LocalizedText }[] = [
    { id: "about", label: both((t) => t.nav.about) },
    { id: "services", label: both((t) => t.nav.services) },
    { id: "work", label: both((t) => t.nav.work) },
    { id: "process", label: both((t) => t.nav.process) },
    { id: "contact", label: both((t) => t.nav.contact) },
  ];
  const navigation: CmsSnapshot["navigation"] = (["header", "footer"] as const).flatMap((location) =>
    navLinks.map(({ id, label }, display_order) => ({
      id: stableId(`nav:${location}:${id}`),
      location,
      label,
      href: `#${id}`,
      visible: true,
      display_order,
      ...timestamps,
    })),
  );

  /* --------------------------------- SEO -------------------------------- */

  seoRows.unshift(
    seoRow({
      key: "page:home",
      page_key: "home",
      title: both((t) => t.meta.title),
      description: both((t) => t.meta.description),
    }),
    seoRow({
      key: "page:about",
      page_key: "about",
      title: both((t) => t.about.label),
      description: both((t) => t.about.statement),
    }),
    seoRow({
      key: "page:services",
      page_key: "services",
      title: both((t) => t.services.label),
      description: {
        en: "Social media management, campaign development, content creation, AI video, creative direction, copywriting, brand identity and company profiles.",
        ar: "إدارة السوشيال ميديا وتطوير الحملات وصناعة المحتوى وفيديو الذكاء الاصطناعي والتوجيه الإبداعي وكتابة المحتوى الإعلاني والهوية البصرية والملفات التعريفية.",
      },
    }),
    seoRow({
      key: "page:projects",
      page_key: "projects",
      title: { en: "Selected Work", ar: "أعمال مختارة" },
      description: both((t) => t.work.lead),
    }),
  );

  /* ------------------------------ settings ------------------------------ */

  return {
    settings: {
      id: true,
      site_name: site.name,
      full_name: site.fullName,
      job_title: both((t) => t.hero.kicker),
      location: site.location,
      address_locality: "Cairo",
      address_country: "EG",
      available_for_freelance: site.availableForFreelance,
      default_locale: "en" satisfies Locale,
      available_locales: ["en", "ar"],
      contact_email: site.contact.email,
      contact_phone: site.contact.phone,
      contact_whatsapp: null,
      logo_mark_media_id: logoMark,
      logo_lockup_media_id: logoLockup,
      favicon_media_id: favicon,
      default_profile_media_id: heroPortrait,
      default_og_media_id: defaultOg,
      title_template: `%s | ${site.name}`,
      allow_indexing: true,
      seeded_at: null,
      ...timestamps,
    },
    sections,
    sectionMedia,
    media: media.all(),
    categories: categoryRows,
    projects: projectRows,
    gallery: galleryRows,
    wall: wallRows,
    services: serviceRows,
    serviceProjects,
    steps,
    achievements,
    socials,
    navigation,
    seo: seoRows,
  };
}
