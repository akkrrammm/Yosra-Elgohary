import type { Locale } from "@/lib/i18n";
import type {
  AchievementRow,
  CategoryRow,
  GalleryRow,
  MediaRow,
  NavigationRow,
  ProcessStepRow,
  ProjectRow,
  ProjectTile,
  SectionMediaRow,
  SectionRow,
  SeoRow,
  ServiceProjectRow,
  ServiceRow,
  SettingsRow,
  SocialLinkRow,
  WallRow,
} from "@/lib/supabase/database.types";

/** A media row with the address its file can be loaded from. */
export type MediaRecord = MediaRow & { url: string };

/** Everything the public site is built from, exactly as stored. */
export type CmsSnapshot = {
  settings: SettingsRow | null;
  sections: SectionRow[];
  sectionMedia: SectionMediaRow[];
  media: MediaRecord[];
  categories: CategoryRow[];
  projects: ProjectRow[];
  gallery: GalleryRow[];
  wall: WallRow[];
  services: ServiceRow[];
  serviceProjects: ServiceProjectRow[];
  steps: ProcessStepRow[];
  achievements: AchievementRow[];
  socials: SocialLinkRow[];
  navigation: NavigationRow[];
  seo: SeoRow[];
};

/* -------------------------------------------------------------------------- */
/*  What components receive: one language, ready to render                     */
/* -------------------------------------------------------------------------- */

export type CmsImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
};

export type LinkItem = { label: string; href: string };

export type ResolvedProject = {
  id: string;
  slug: string;
  title: string;
  shortName: string;
  description: string;
  categoryId: string | null;
  categoryLabel: string;
  client?: string;
  coverImage: CmsImage;
  coverBackground?: string;
  gallery: CmsImage[];
  /** The pages fanned out when tile is "deck": left, right, then center. */
  deck: CmsImage[];
  /** Set for video projects. `src` is present when a file was uploaded. */
  video?: { src?: string };
  role?: string[];
  tools: string[];
  deliverables?: string[];
  behanceUrl?: string;
  featured: boolean;
  draft: boolean;
  tile: ProjectTile;
  caseStudy: {
    overview?: string;
    quote?: string;
    context?: string;
    objective?: string;
    direction?: string;
    strategy?: string;
    highlights: { title: string; text: string }[];
    palette: { name: string; hex: string; share: string }[];
  };
};

export type ServiceProof = { slug: string; label: string };

export type ResolvedService = {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  proof: ServiceProof[];
  /** Shown beside the list while this service is in focus. */
  preview: { key: string; image: CmsImage; background?: string } | null;
};

export type ResolvedStep = {
  id: string;
  title: string;
  text: string;
  icon: string | null;
  image: CmsImage | null;
};

export type WallPage = CmsImage & { slug: string };

export type ProjectLabels = {
  back: string;
  client: string;
  role: string;
  tools: string;
  deliverables: string;
  overview: string;
  context: string;
  objective: string;
  direction: string;
  contentStrategy: string;
  palette: string;
  system: string;
  gallery: string;
  relatedVisuals: string;
  viewOnBehance: string;
  watchOnBehance: string;
  next: string;
  draftBadge: string;
  lightbox: { label: string; close: string; prev: string; next: string; open: string; of: string };
};

export type SiteData = {
  lang: Locale;
  isPreview: boolean;
  availableLocales: Locale[];
  defaultLocale: Locale;
  settings: {
    name: string;
    fullName: string;
    jobTitle: string;
    location: string;
    addressLocality: string;
    addressCountry: string;
    availableForFreelance: boolean;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    titleTemplate: string;
    allowIndexing: boolean;
  };
  logos: {
    mark: CmsImage | null;
    lockup: CmsImage | null;
    favicon: string | null;
    defaultOg: CmsImage | null;
    defaultProfile: CmsImage | null;
  };
  socials: LinkItem[];
  /** Homepage sections after the hero and ribbon, in the chosen order, hidden ones left out. */
  homepageOrder: HomepageSection[];
  hero: {
    visible: boolean;
    firstName: string;
    lastName: string;
    kicker: string;
    available: string;
    headlineA: string;
    headlineB: string;
    intro: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    sealText: string;
    showSeal: boolean;
    portrait: CmsImage | null;
    background: CmsImage | null;
    logo: CmsImage | null;
  };
  ribbon: { visible: boolean; items: string[] };
  about: {
    visible: boolean;
    label: string;
    statement: string;
    lead: string;
    principlesTitle: string;
    principles: { title: string; text: string }[];
    facts: { label: string; value: string }[];
    portrait: CmsImage | null;
    additional: CmsImage[];
  };
  services: {
    visible: boolean;
    label: string;
    title: string;
    seenIn: string;
    items: ResolvedService[];
  };
  work: {
    visible: boolean;
    titleA: string;
    titleB: string;
    lead: string;
    filterLabel: string;
    allLabel: string;
    playlistTitle: string;
    wallTitle: string;
    viewLabel: string;
    openLabel: string;
    videoLabel: string;
    featuredLabel: string;
    showWall: boolean;
    categories: { id: string; label: string }[];
    wall: WallPage[][];
  };
  /** Every project this request may see, in display order. */
  projects: ResolvedProject[];
  process: {
    visible: boolean;
    label: string;
    title: string;
    lead: string;
    steps: ResolvedStep[];
    portrait: CmsImage | null;
  };
  achievements: {
    visible: boolean;
    title: string;
    note: string;
    items: { id: string; value: string; label: string }[];
  };
  contact: {
    visible: boolean;
    label: string;
    headlineA: string;
    headlineB: string;
    text: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    elsewhereLabel: string;
    locationLabel: string;
    phoneLabel: string;
    whatsappLabel: string;
    portrait: CmsImage | null;
    background: CmsImage | null;
  };
  navigation: {
    header: LinkItem[];
    footer: LinkItem[];
    ctaLabel: string;
    ctaHref: string;
    labels: { menu: string; close: string; skip: string; home: string; main: string; footer: string };
  };
  footer: { rights: string; topLabel: string; logoAlt: string };
  projectLabels: ProjectLabels;
  notFound: { title: string; text: string; back: string };
};

export type HomepageSection = "about" | "services" | "work" | "process" | "achievements" | "contact";
