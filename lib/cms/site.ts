import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { hasLocale, type Locale } from "@/lib/i18n";
import type { Json, LocalizedList, LocalizedText, ProjectRow, SeoPageKey, SeoRow } from "@/lib/supabase/database.types";
import { getCmsSnapshot } from "./snapshot";
import type {
  CmsImage,
  CmsSnapshot,
  HomepageSection,
  LinkItem,
  ResolvedProject,
  ResolvedService,
  ResolvedStep,
  SiteData,
  WallPage,
} from "./types";

const HOMEPAGE_SECTIONS: HomepageSection[] = ["about", "services", "work", "process", "achievements", "contact"];

/** Which homepage section an in-page link such as #about points at. */
const ANCHOR_SECTIONS: Record<string, string> = {
  about: "about",
  services: "services",
  work: "work",
  process: "process",
  achievements: "achievements",
  contact: "contact",
};

/** Language helpers bound to one language. A missing translation falls back to the other language. */
function createLocalizer(lang: Locale) {
  const other: Locale = lang === "en" ? "ar" : "en";

  const text = (value: unknown): string => {
    if (!value || typeof value !== "object") return "";
    const localized = value as LocalizedText;
    return localized[lang]?.trim() ? (localized[lang] as string) : (localized[other] ?? "").trim() ? (localized[other] as string) : "";
  };

  const list = (value: unknown): string[] => {
    if (!value || typeof value !== "object") return [];
    const localized = value as LocalizedList;
    return localized[lang]?.length ? (localized[lang] as string[]) : (localized[other] ?? []);
  };

  return { text, list };
}

const plain = (value: Json | undefined) => (typeof value === "string" ? value : "");
const asList = (value: Json | undefined) => (Array.isArray(value) ? (value as Record<string, Json>[]) : []);

export function buildSite(snapshot: CmsSnapshot, lang: Locale, isPreview: boolean): SiteData {
  const { text, list } = createLocalizer(lang);

  const mediaById = new Map(snapshot.media.map((row) => [row.id, row]));

  const image = (mediaId: string | null | undefined, caption?: string): CmsImage | null => {
    const media = mediaId ? mediaById.get(mediaId) : undefined;
    if (!media) return null;
    return {
      src: media.url,
      width: media.width ?? 1200,
      height: media.height ?? 800,
      alt: text(media.alt),
      ...(caption ? { caption } : {}),
    };
  };

  const sectionByKey = new Map(snapshot.sections.map((row) => [row.key, row]));
  const content = (key: string) => sectionByKey.get(key)?.content ?? {};
  const isVisible = (key: string) => sectionByKey.get(key)?.visible === true;

  const slotImages = (key: string, slot: string) =>
    snapshot.sectionMedia
      .filter((row) => row.section_key === key && row.slot === slot)
      .sort((a, b) => a.position - b.position)
      .flatMap((row) => image(row.media_id) ?? []);
  const slotImage = (key: string, slot: string) => slotImages(key, slot)[0] ?? null;

  /* ------------------------------ projects ------------------------------ */

  const categoryName = new Map(snapshot.categories.filter((c) => c.visible).map((c) => [c.id, text(c.name)]));

  const visibleProjects = [...snapshot.projects]
    .filter((project) => isPreview || project.status === "published")
    .sort((a, b) => a.display_order - b.display_order);

  const resolveProject = (row: ProjectRow): ResolvedProject | null => {
    // Only a draft can lack a cover, and only an administrator sees drafts. A stand-in lets it be previewed.
    const settings = snapshot.settings;
    const cover =
      image(row.cover_media_id) ??
      (row.status === "draft" ? (image(settings?.default_og_media_id) ?? image(settings?.logo_lockup_media_id) ?? image(settings?.logo_mark_media_id)) : null);
    if (!cover) return null;

    const galleryRows = snapshot.gallery
      .filter((item) => item.project_id === row.id)
      .sort((a, b) => a.display_order - b.display_order);
    const gallery = galleryRows.flatMap((item) => image(item.media_id, text(item.caption) || undefined) ?? []);
    const deck = galleryRows
      .filter((item) => item.deck_position !== null)
      .sort((a, b) => (a.deck_position ?? 0) - (b.deck_position ?? 0))
      .flatMap((item) => image(item.media_id) ?? []);

    const role = list(row.role);
    const deliverables = list(row.deliverables);
    const videoUrl = row.video_media_id ? mediaById.get(row.video_media_id)?.url : undefined;

    return {
      id: row.id,
      slug: row.slug,
      title: text(row.title),
      shortName: row.short_name || text(row.title),
      description: text(row.short_description),
      categoryId: row.category_id,
      categoryLabel: row.category_id ? (categoryName.get(row.category_id) ?? "") : "",
      client: row.client ?? undefined,
      coverImage: cover,
      coverBackground: row.cover_background ?? undefined,
      gallery,
      // A deck tile always has something to fan out, even before pages are chosen for it.
      deck: deck.length > 0 ? deck : gallery.slice(0, 3).length > 0 ? gallery.slice(0, 3) : [cover],
      video: row.is_video ? { src: videoUrl } : undefined,
      role: role.length > 0 ? role : undefined,
      tools: row.tools,
      deliverables: deliverables.length > 0 ? deliverables : undefined,
      behanceUrl: row.behance_url ?? undefined,
      featured: row.featured,
      draft: row.status === "draft",
      tile: row.tile,
      caseStudy: {
        overview: text(row.full_description) || undefined,
        quote: text(row.quote) || undefined,
        context: text(row.context) || undefined,
        objective: text(row.objective) || undefined,
        direction: text(row.direction) || undefined,
        strategy: text(row.strategy) || undefined,
        highlights: row.highlights.map((item) => ({ title: text(item.title), text: text(item.text) })),
        palette: row.palette,
      },
    };
  };

  const projects = visibleProjects.flatMap((row) => resolveProject(row) ?? []);
  const projectById = new Map(projects.map((project) => [project.id, project]));

  /* ------------------------------ services ------------------------------ */

  const services: ResolvedService[] = snapshot.services
    .filter((row) => row.visible)
    .sort((a, b) => a.display_order - b.display_order)
    .map((row) => {
      const proofProjects = snapshot.serviceProjects
        .filter((link) => link.service_id === row.id)
        .sort((a, b) => a.display_order - b.display_order)
        .flatMap((link) => projectById.get(link.project_id) ?? []);
      const ownImage = image(row.image_media_id);
      const first = proofProjects[0];
      return {
        id: row.id,
        name: text(row.name),
        description: text(row.description),
        icon: row.icon,
        proof: proofProjects.map((project) => ({ slug: project.slug, label: project.shortName })),
        preview: ownImage
          ? { key: `service-${row.id}`, image: ownImage }
          : first
            ? { key: first.slug, image: first.coverImage, background: first.coverBackground }
            : null,
      };
    });

  /* -------------------------------- steps ------------------------------- */

  const steps: ResolvedStep[] = snapshot.steps
    .filter((row) => row.visible)
    .sort((a, b) => a.display_order - b.display_order)
    .map((row) => ({
      id: row.id,
      title: text(row.title),
      text: text(row.description),
      icon: row.icon,
      image: image(row.image_media_id),
    }));

  /* -------------------------------- wall -------------------------------- */

  const galleryById = new Map(snapshot.gallery.map((item) => [item.id, item]));
  const wall: WallPage[][] = [0, 1].map((rowIndex) =>
    snapshot.wall
      .filter((item) => item.row_index === rowIndex)
      .sort((a, b) => a.display_order - b.display_order)
      .flatMap((item) => {
        const galleryItem = galleryById.get(item.gallery_item_id);
        const project = galleryItem && projectById.get(galleryItem.project_id);
        const page = galleryItem && image(galleryItem.media_id);
        return project && page ? [{ ...page, slug: project.slug }] : [];
      }),
  );

  /* -------------------------------- links ------------------------------- */

  const navItems = (location: "header" | "footer"): LinkItem[] =>
    snapshot.navigation
      .filter((item) => item.location === location && item.visible)
      .sort((a, b) => a.display_order - b.display_order)
      .filter((item) => {
        // A link to a hidden section would go nowhere, so it hides along with the section.
        if (!item.href.startsWith("#")) return true;
        const section = ANCHOR_SECTIONS[item.href.slice(1)];
        return section ? isVisible(section) : true;
      })
      .map((item) => ({ label: text(item.label), href: item.href }));

  const socials: LinkItem[] = snapshot.socials
    .filter((item) => item.visible)
    .sort((a, b) => a.display_order - b.display_order)
    .map((item) => ({ label: item.label, href: item.url }));

  /* ------------------------------ sections ------------------------------ */

  const settings = snapshot.settings;
  const hero = content("hero");
  const about = content("about");
  const servicesCopy = content("services");
  const work = content("work");
  const process = content("process");
  const achievements = content("achievements");
  const contact = content("contact");
  const navigation = content("navigation");
  const footer = content("footer");
  const labels = content("labels");

  const usedCategories = new Set(projects.map((project) => project.categoryId));

  const homepageOrder = HOMEPAGE_SECTIONS.filter((key) => isVisible(key)).sort(
    (a, b) => (sectionByKey.get(a)?.display_order ?? 0) - (sectionByKey.get(b)?.display_order ?? 0),
  );

  const availableLocales = (settings?.available_locales ?? ["en", "ar"]).filter(hasLocale);
  const defaultLocale = settings && hasLocale(settings.default_locale) ? settings.default_locale : "en";

  return {
    lang,
    isPreview,
    availableLocales,
    defaultLocale,
    settings: {
      name: settings?.site_name ?? "",
      fullName: settings?.full_name ?? "",
      jobTitle: text(settings?.job_title),
      location: text(settings?.location),
      addressLocality: settings?.address_locality ?? "",
      addressCountry: settings?.address_country ?? "",
      availableForFreelance: settings?.available_for_freelance ?? false,
      email: settings?.contact_email ?? null,
      phone: settings?.contact_phone ?? null,
      whatsapp: settings?.contact_whatsapp ?? null,
      titleTemplate: settings?.title_template ?? "%s",
      allowIndexing: settings?.allow_indexing ?? true,
    },
    logos: {
      mark: image(settings?.logo_mark_media_id),
      lockup: image(settings?.logo_lockup_media_id),
      favicon: image(settings?.favicon_media_id)?.src ?? null,
      defaultOg: image(settings?.default_og_media_id),
      defaultProfile: image(settings?.default_profile_media_id),
    },
    socials,
    homepageOrder,
    hero: {
      visible: isVisible("hero"),
      firstName: text(hero.first_name),
      lastName: text(hero.last_name),
      kicker: text(hero.kicker),
      available: text(hero.available_text),
      headlineA: text(hero.headline_a),
      headlineB: text(hero.headline_b),
      intro: text(hero.intro),
      primaryLabel: text(hero.primary_label),
      primaryHref: plain(hero.primary_href),
      secondaryLabel: text(hero.secondary_label),
      secondaryHref: plain(hero.secondary_href),
      sealText: plain(hero.seal_text),
      showSeal: hero.show_seal !== false,
      portrait: slotImage("hero", "portrait"),
      background: slotImage("hero", "background"),
      logo: slotImage("hero", "logo") ?? image(settings?.logo_mark_media_id),
    },
    ribbon: {
      visible: isVisible("ribbon"),
      items: asList(content("ribbon").items)
        .map((item) => text(item.text))
        .filter(Boolean),
    },
    about: {
      visible: isVisible("about"),
      label: text(about.label),
      statement: text(about.statement),
      lead: text(about.lead),
      principlesTitle: text(about.principles_title),
      principles: asList(about.principles).map((item) => ({ title: text(item.title), text: text(item.text) })),
      facts: asList(about.facts).map((item) => ({ label: text(item.label), value: text(item.value) })),
      portrait: slotImage("about", "portrait"),
      additional: slotImages("about", "additional"),
    },
    services: {
      visible: isVisible("services"),
      label: text(servicesCopy.label),
      title: text(servicesCopy.title),
      seenIn: text(servicesCopy.seen_in),
      items: services,
    },
    work: {
      visible: isVisible("work"),
      titleA: text(work.title_a),
      titleB: text(work.title_b),
      lead: text(work.lead),
      filterLabel: text(work.filter_label),
      allLabel: text(work.all_label),
      playlistTitle: text(work.playlist_title),
      wallTitle: text(work.wall_title),
      viewLabel: text(work.view_label),
      openLabel: text(work.open_label),
      videoLabel: text(work.video_label),
      featuredLabel: text(work.featured_label),
      showWall: work.show_wall !== false,
      categories: snapshot.categories
        .filter((category) => category.visible && usedCategories.has(category.id))
        .sort((a, b) => a.display_order - b.display_order)
        .map((category) => ({ id: category.id, label: text(category.name) })),
      wall,
    },
    projects,
    process: {
      visible: isVisible("process"),
      label: text(process.label),
      title: text(process.title),
      lead: text(process.lead),
      steps,
      portrait: slotImage("process", "portrait"),
    },
    achievements: {
      visible: isVisible("achievements"),
      title: text(achievements.title),
      note: text(achievements.note),
      items: snapshot.achievements
        .filter((row) => row.visible)
        .sort((a, b) => a.display_order - b.display_order)
        .map((row) => ({ id: row.id, value: row.value, label: text(row.label) })),
    },
    contact: {
      visible: isVisible("contact"),
      label: text(contact.label),
      headlineA: text(contact.headline_a),
      headlineB: text(contact.headline_b),
      text: text(contact.text),
      primaryLabel: text(contact.primary_label),
      primaryHref: plain(contact.primary_href),
      secondaryLabel: text(contact.secondary_label),
      secondaryHref: plain(contact.secondary_href),
      elsewhereLabel: text(contact.elsewhere_label),
      locationLabel: text(contact.location_label),
      phoneLabel: text(contact.phone_label),
      whatsappLabel: text(contact.whatsapp_label),
      portrait: slotImage("contact", "portrait"),
      background: slotImage("contact", "background"),
    },
    navigation: {
      header: navItems("header"),
      footer: navItems("footer"),
      ctaLabel: text(navigation.cta_label),
      ctaHref: plain(navigation.cta_href),
      labels: {
        menu: text(navigation.menu_label),
        close: text(navigation.close_label),
        skip: text(navigation.skip_label),
        home: text(navigation.home_label),
        main: text(navigation.main_label),
        footer: text(navigation.footer_label),
      },
    },
    footer: {
      rights: text(footer.rights),
      topLabel: text(footer.top_label),
      logoAlt: text(footer.logo_alt),
    },
    projectLabels: {
      back: text(labels.back),
      client: text(labels.client),
      role: text(labels.role),
      tools: text(labels.tools),
      deliverables: text(labels.deliverables),
      overview: text(labels.overview),
      context: text(labels.context),
      objective: text(labels.objective),
      direction: text(labels.direction),
      contentStrategy: text(labels.content_strategy),
      palette: text(labels.palette),
      system: text(labels.system),
      gallery: text(labels.gallery),
      relatedVisuals: text(labels.related_visuals),
      viewOnBehance: text(labels.view_on_behance),
      watchOnBehance: text(labels.watch_on_behance),
      next: text(labels.next),
      draftBadge: text(labels.draft_badge),
      lightbox: {
        label: text(labels.lightbox_label),
        close: text(labels.lightbox_close),
        prev: text(labels.lightbox_prev),
        next: text(labels.lightbox_next),
        open: text(labels.lightbox_open),
        of: text(labels.lightbox_of),
      },
    },
    notFound: {
      title: text(labels.not_found_title),
      text: text(labels.not_found_text),
      back: text(labels.not_found_back),
    },
  };
}

/** A language that has been switched off sends visitors to the same page in the default language. */
export function keepToAvailableLanguage(site: SiteData, path = "") {
  if (!site.availableLocales.includes(site.lang)) redirect(`/${site.defaultLocale}${path}`);
}

/** Everything a page needs in one language. Safe to call repeatedly within a request. */
export const getSite = cache(async (lang: Locale) => {
  const { snapshot, isPreview } = await getCmsSnapshot();
  return buildSite(snapshot, lang, isPreview);
});

/** The SEO record for a page or project, in one language. */
export const getSeo = cache(async (target: { page: SeoPageKey } | { projectId: string }, lang: Locale) => {
  const { snapshot } = await getCmsSnapshot();
  const { text } = createLocalizer(lang);
  const row: SeoRow | undefined = snapshot.seo.find((item) =>
    "page" in target ? item.page_key === target.page : item.project_id === target.projectId,
  );
  const media = row?.og_media_id ? snapshot.media.find((item) => item.id === row.og_media_id) : undefined;

  return {
    title: text(row?.title),
    description: text(row?.description),
    ogTitle: text(row?.og_title),
    ogDescription: text(row?.og_description),
    ogImage: media ? { url: media.url, width: media.width ?? 1200, height: media.height ?? 630 } : null,
    twitterTitle: text(row?.twitter_title),
    twitterDescription: text(row?.twitter_description),
    twitterCard: row?.twitter_card ?? ("summary_large_image" as const),
    canonicalUrl: row?.canonical_url ?? null,
    noindex: row?.noindex ?? false,
  };
});
