import { CMS_ICONS } from "./icons";
import type { FieldDef, Fieldset } from "./fields";

/**
 * What can be edited, in the words the dashboard shows. Each key matches what the
 * public site reads in lib/cms/site.ts. To add a field, add it here and read it there.
 */

const localizedText = (key: string, label: string, extra: Partial<FieldDef> = {}) =>
  ({ key, label, type: "text", localized: true, ...extra }) as FieldDef;
const localizedArea = (key: string, label: string, extra: Partial<FieldDef> = {}) =>
  ({ key, label, type: "textarea", localized: true, rows: 3, ...extra }) as FieldDef;
const link = (key: string, label: string, help = "Where it goes: #contact, /work, or a full https:// address.") =>
  ({ key, label, type: "link", help }) as FieldDef;

export type SectionDefinition = {
  key: string;
  title: string;
  description: string;
  /** False for content that is always on, such as button labels. */
  canHide: boolean;
  fieldsets: Fieldset[];
};

const section = (definition: SectionDefinition) => definition;

export const SECTIONS = {
  hero: section({
    key: "hero",
    title: "Hero",
    description: "The first thing visitors see at the top of the homepage.",
    canHide: true,
    fieldsets: [
      {
        title: "Your name",
        description: "Shown very large across the page. If the Arabic is left empty, the English name is shown on the Arabic site too.",
        fields: [
          localizedText("first_name", "First name", { required: true, max: 30, arabicOptional: true }),
          localizedText("last_name", "Last name", { required: true, max: 30, arabicOptional: true }),
        ],
      },
      {
        title: "Message",
        fields: [
          localizedText("kicker", "Job title line", { max: 80, help: "The small line above the headline." }),
          localizedText("headline_a", "Headline, first line", { required: true, max: 40 }),
          localizedText("headline_b", "Headline, second line (pink)", { max: 40 }),
          localizedArea("intro", "Introduction", { max: 300 }),
          localizedText("available_text", "Availability text", {
            max: 40,
            help: "Shown only while “Available for freelance” is on in Website Settings.",
          }),
        ],
      },
      {
        title: "Buttons",
        fields: [
          localizedText("primary_label", "Main button text", { max: 30 }),
          link("primary_href", "Main button destination"),
          localizedText("secondary_label", "Second button text", { max: 30 }),
          link("secondary_href", "Second button destination"),
        ],
      },
      {
        title: "Images",
        fields: [
          { key: "portrait", label: "Profile image", type: "media", folder: "profile", help: "A tall photo works best." },
          { key: "background", label: "Background image (optional)", type: "media", folder: "sections", help: "Sits faintly behind the whole hero." },
          { key: "logo", label: "Logo in the round seal (optional)", type: "media", folder: "logo", help: "Leave empty to use the logo from Website Settings." },
        ],
      },
      {
        title: "Round seal",
        fields: [
          { key: "show_seal", label: "Show the rotating seal", type: "toggle" },
          { key: "seal_text", label: "Seal text", type: "text", max: 40, help: "Latin letters look best on the curve. End with “ /” so it joins up neatly." },
        ],
      },
    ],
  }),

  ribbon: section({
    key: "ribbon",
    title: "Moving ribbon",
    description: "The lime strip of words that moves across the page under the hero.",
    canHide: true,
    fieldsets: [
      {
        fields: [
          {
            key: "items",
            label: "Words",
            type: "list",
            itemLabel: "Word or phrase",
            titleKey: "text",
            fields: [localizedText("text", "Text", { required: true, max: 50, arabicOptional: true })],
          },
        ],
      },
    ],
  }),

  about: section({
    key: "about",
    title: "About",
    description: "Who you are, how you think and the key facts.",
    canHide: true,
    fieldsets: [
      {
        title: "Introduction",
        fields: [
          localizedText("label", "Section label", { max: 30 }),
          localizedArea("statement", "Large statement", { required: true, max: 200, help: "The big sentence that lights up word by word." }),
          localizedArea("lead", "Full description", { rows: 5, max: 700 }),
        ],
      },
      {
        title: "Images",
        fields: [
          { key: "portrait", label: "Portrait", type: "media", folder: "profile", help: "A wide photo works best." },
          { key: "additional", label: "Additional images (optional)", type: "media", folder: "sections", multiple: true, help: "Shown as a small row under the portrait." },
        ],
      },
      {
        title: "How you think",
        fields: [
          localizedText("principles_title", "Heading", { max: 40 }),
          {
            key: "principles",
            label: "Principles",
            type: "list",
            itemLabel: "Principle",
            titleKey: "title",
            fields: [localizedText("title", "Title", { required: true, max: 60 }), localizedArea("text", "Text", { max: 300 })],
          },
        ],
      },
      {
        title: "Key information",
        fields: [
          {
            key: "facts",
            label: "Highlights",
            type: "list",
            itemLabel: "Highlight",
            titleKey: "label",
            fields: [localizedText("label", "Label", { required: true, max: 40 }), localizedText("value", "Value", { required: true, max: 160 })],
          },
        ],
      },
    ],
  }),

  services: section({
    key: "services",
    title: "Section text",
    description: "The heading above the list of services.",
    canHide: true,
    fieldsets: [
      {
        fields: [
          localizedText("label", "Section label", { max: 30 }),
          localizedText("title", "Heading", { required: true, max: 40 }),
          localizedText("seen_in", "“Seen in” label", { max: 30, help: "Shown before the projects linked to each service." }),
        ],
      },
    ],
  }),

  work: section({
    key: "work",
    title: "Selected Work section",
    description: "The text around the project list on the homepage.",
    canHide: true,
    fieldsets: [
      {
        title: "Heading",
        fields: [
          localizedText("title_a", "Heading, first word", { required: true, max: 30 }),
          localizedText("title_b", "Heading, second word (pink)", { max: 30 }),
          localizedArea("lead", "Introduction", { max: 200 }),
        ],
      },
      {
        title: "Project list",
        fields: [
          localizedText("all_label", "“All” filter button", { max: 20 }),
          localizedText("filter_label", "Filter buttons description", { max: 60, help: "Read aloud by screen readers." }),
          localizedText("playlist_title", "Heading above the video list", { max: 60 }),
          localizedText("view_label", "Text in the circle that follows the pointer", { max: 20 }),
          localizedText("open_label", "“Open” link on phones", { max: 20 }),
          localizedText("video_label", "“Video” tag", { max: 20 }),
          localizedText("featured_label", "“Featured” tag", { max: 20 }),
        ],
      },
      {
        title: "Wall of pages",
        fields: [
          { key: "show_wall", label: "Show the wall of pages", type: "toggle" },
          localizedText("wall_title", "Heading above the wall", { max: 60 }),
        ],
      },
    ],
  }),

  process: section({
    key: "process",
    title: "Section text",
    description: "The heading and image beside the process steps.",
    canHide: true,
    fieldsets: [
      {
        fields: [
          localizedText("label", "Section label", { max: 30 }),
          localizedText("title", "Heading", { required: true, max: 40 }),
          localizedArea("lead", "Introduction", { max: 200 }),
          { key: "portrait", label: "Image inside the circle", type: "media", folder: "profile" },
        ],
      },
    ],
  }),

  achievements: section({
    key: "achievements",
    title: "Section text",
    description: "The heading above the numbers.",
    canHide: true,
    fieldsets: [
      {
        fields: [localizedText("title", "Heading", { required: true, max: 60 }), localizedText("note", "Small note", { max: 120 })],
      },
    ],
  }),

  contact: section({
    key: "contact",
    title: "Contact section",
    description: "The closing section of the homepage.",
    canHide: true,
    fieldsets: [
      {
        title: "Message",
        fields: [
          localizedText("label", "Section label", { max: 30 }),
          localizedText("headline_a", "Headline, first line", { required: true, max: 40 }),
          localizedText("headline_b", "Headline, second line (pink)", { max: 40 }),
          localizedArea("text", "Description", { max: 240 }),
        ],
      },
      {
        title: "Buttons",
        description: "When an email address is set below, it becomes the main button and these follow it.",
        fields: [
          localizedText("primary_label", "First button text", { max: 40 }),
          link("primary_href", "First button destination"),
          localizedText("secondary_label", "Second button text", { max: 40 }),
          link("secondary_href", "Second button destination"),
        ],
      },
      {
        title: "Images",
        fields: [
          { key: "portrait", label: "Portrait", type: "media", folder: "profile", help: "A tall photo works best." },
          { key: "background", label: "Background image (optional)", type: "media", folder: "sections" },
        ],
      },
      {
        title: "Small labels",
        fields: [
          localizedText("location_label", "“Based in” label", { max: 30 }),
          localizedText("elsewhere_label", "“Find me on” label", { max: 30 }),
          localizedText("phone_label", "“Phone” label", { max: 30 }),
          localizedText("whatsapp_label", "“WhatsApp” label", { max: 30 }),
        ],
      },
    ],
  }),

  navigation: section({
    key: "navigation",
    title: "Top bar",
    description: "The button in the top bar, and labels read aloud by screen readers.",
    canHide: false,
    fieldsets: [
      {
        title: "Button",
        fields: [localizedText("cta_label", "Button text", { max: 24 }), link("cta_href", "Button destination")],
      },
      {
        title: "Screen reader labels",
        description: "Not shown on screen. They describe the controls to people using screen readers.",
        fields: [
          localizedText("menu_label", "Open menu", { max: 40 }),
          localizedText("close_label", "Close menu", { max: 40 }),
          localizedText("skip_label", "Skip to content", { max: 40 }),
          localizedText("home_label", "Link to the homepage", { max: 60 }),
          localizedText("main_label", "Main navigation", { max: 40 }),
          localizedText("footer_label", "Footer navigation", { max: 40 }),
        ],
      },
    ],
  }),

  footer: section({
    key: "footer",
    title: "Footer",
    description: "The small text at the very bottom of every page.",
    canHide: false,
    fieldsets: [
      {
        fields: [
          localizedText("rights", "Copyright text", { max: 80, help: "Shown after the year and the website name." }),
          localizedText("top_label", "“Back to top” link", { max: 30 }),
          localizedText("logo_alt", "Logo description", { max: 80, help: "Read aloud by screen readers." }),
        ],
      },
    ],
  }),

  labels: section({
    key: "labels",
    title: "Small text on project pages",
    description: "Labels and buttons that repeat on every project page, plus the “page not found” message.",
    canHide: false,
    fieldsets: [
      {
        title: "Project page labels",
        fields: [
          localizedText("back", "Back link", { max: 30 }),
          localizedText("client", "Client", { max: 30 }),
          localizedText("role", "My role", { max: 30 }),
          localizedText("tools", "Tools", { max: 30 }),
          localizedText("deliverables", "Deliverables", { max: 30 }),
          localizedText("overview", "Overview", { max: 30 }),
          localizedText("context", "Brand context", { max: 30 }),
          localizedText("objective", "Objective", { max: 30 }),
          localizedText("direction", "Creative direction", { max: 30 }),
          localizedText("content_strategy", "Strategy", { max: 30 }),
          localizedText("system", "Key points heading", { max: 30 }),
          localizedText("palette", "Color system", { max: 30 }),
          localizedText("gallery", "Gallery heading", { max: 40 }),
          localizedText("related_visuals", "Gallery heading on video projects", { max: 40 }),
          localizedText("view_on_behance", "“View on Behance” button", { max: 40 }),
          localizedText("watch_on_behance", "“Watch on Behance” button", { max: 40 }),
          localizedText("next", "Next project", { max: 30 }),
          localizedText("draft_badge", "Preview tag", { max: 30 }),
        ],
      },
      {
        title: "Full-screen image viewer (screen reader labels)",
        fields: [
          localizedText("lightbox_label", "Viewer name", { max: 40 }),
          localizedText("lightbox_open", "Open", { max: 60 }),
          localizedText("lightbox_close", "Close", { max: 40 }),
          localizedText("lightbox_prev", "Previous", { max: 40 }),
          localizedText("lightbox_next", "Next", { max: 40 }),
          localizedText("lightbox_of", "The word “of”, as in 2 of 14", { max: 10 }),
        ],
      },
      {
        title: "Page not found",
        fields: [
          localizedText("not_found_title", "Heading", { max: 60 }),
          localizedText("not_found_text", "Message", { max: 160 }),
          localizedText("not_found_back", "Button text", { max: 40 }),
        ],
      },
    ],
  }),
} satisfies Record<string, SectionDefinition>;

export type SectionKey = keyof typeof SECTIONS;

/** The sections that can be reordered on the homepage. */
export const HOMEPAGE_ORDERED = [
  { key: "about", label: "About", href: "/admin/about" },
  { key: "services", label: "Services", href: "/admin/services" },
  { key: "work", label: "Selected Work", href: "/admin/projects" },
  { key: "process", label: "Work process", href: "/admin/process" },
  { key: "achievements", label: "Results & achievements", href: "/admin/achievements" },
  { key: "contact", label: "Contact", href: "/admin/contact" },
] as const;

/* -------------------------------------------------------------------------- */
/*  Lists of items                                                            */
/* -------------------------------------------------------------------------- */

export type CollectionDefinition = {
  key: string;
  table: "services" | "process_steps" | "achievements" | "project_categories" | "social_links" | "navigation_items";
  singular: string;
  plural: string;
  /** The field that names a row in the list. */
  titleKey: string;
  subtitleKey?: string;
  canHide: boolean;
  emptyMessage: string;
  /** Values every row in this list has, such as which menu it belongs to. */
  fixed?: Record<string, string>;
  fields: FieldDef[];
};

export const COLLECTIONS = {
  services: {
    key: "services",
    table: "services",
    singular: "service",
    plural: "services",
    titleKey: "name",
    subtitleKey: "description",
    canHide: true,
    emptyMessage: "No services yet. Add the first one.",
    fields: [
      localizedText("name", "Service name", { required: true, max: 60 }),
      localizedArea("description", "Description", { max: 300 }),
      { key: "icon", label: "Icon (optional)", type: "icon" },
      {
        key: "image_media_id",
        label: "Image (optional)",
        type: "media",
        folder: "services",
        help: "Shown beside the list while this service is in focus. Without one, the cover of its first project is used.",
      },
      {
        key: "proof",
        label: "Projects that show this service",
        type: "projects",
        help: "Listed under “Seen in”. Only published projects appear on the website.",
      },
    ],
  },
  process_steps: {
    key: "process_steps",
    table: "process_steps",
    singular: "step",
    plural: "steps",
    titleKey: "title",
    subtitleKey: "description",
    canHide: true,
    emptyMessage: "No steps yet. Add the first one.",
    fields: [
      localizedText("title", "Step title", { required: true, max: 60 }),
      localizedArea("description", "Description", { max: 300 }),
      { key: "icon", label: "Icon (optional)", type: "icon" },
      { key: "image_media_id", label: "Image (optional)", type: "media", folder: "sections" },
    ],
  },
  achievements: {
    key: "achievements",
    table: "achievements",
    singular: "number",
    plural: "numbers",
    titleKey: "value",
    subtitleKey: "label",
    canHide: true,
    emptyMessage: "No numbers yet. Only add results you can back up.",
    fields: [
      { key: "value", label: "Number", type: "text", required: true, max: 20, help: "For example 6, 110 or 2.5M. Only use real numbers you can back up." },
      localizedText("label", "What it counts", { required: true, max: 80 }),
    ],
  },
  project_categories: {
    key: "project_categories",
    table: "project_categories",
    singular: "category",
    plural: "categories",
    titleKey: "name",
    subtitleKey: "slug",
    canHide: true,
    emptyMessage: "No categories yet. Add the first one.",
    fields: [
      localizedText("name", "Category name", { required: true, max: 50 }),
      { key: "slug", label: "Short name for the system", type: "slug", source: "name", help: "Filled in for you. Lowercase English letters, numbers and dashes." },
    ],
  },
  social_links: {
    key: "social_links",
    table: "social_links",
    singular: "link",
    plural: "social links",
    titleKey: "label",
    subtitleKey: "url",
    canHide: true,
    emptyMessage: "No social links yet. Add the first one.",
    fields: [
      { key: "label", label: "Name", type: "text", required: true, max: 30, placeholder: "Instagram" },
      { key: "url", label: "Address", type: "url", required: true, placeholder: "https://www.instagram.com/your-name" },
    ],
  },
  nav_header: {
    key: "nav_header",
    table: "navigation_items",
    singular: "link",
    plural: "top bar links",
    titleKey: "label",
    subtitleKey: "href",
    canHide: true,
    emptyMessage: "No links in the top bar.",
    fixed: { location: "header" },
    fields: [
      localizedText("label", "Link text", { required: true, max: 30 }),
      { ...link("href", "Destination"), required: true } as FieldDef,
    ],
  },
  nav_footer: {
    key: "nav_footer",
    table: "navigation_items",
    singular: "link",
    plural: "footer links",
    titleKey: "label",
    subtitleKey: "href",
    canHide: true,
    emptyMessage: "No links in the footer.",
    fixed: { location: "footer" },
    fields: [
      localizedText("label", "Link text", { required: true, max: 30 }),
      { ...link("href", "Destination"), required: true } as FieldDef,
    ],
  },
} satisfies Record<string, CollectionDefinition>;

export type CollectionKey = keyof typeof COLLECTIONS;

/* -------------------------------------------------------------------------- */
/*  Website settings                                                          */
/* -------------------------------------------------------------------------- */

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
];

export const SETTINGS_GROUPS = {
  brand: {
    title: "Personal brand",
    description: "The name and details used across the whole website.",
    fieldsets: [
      {
        fields: [
          { key: "site_name", label: "Website name", type: "text", required: true, max: 60, help: "Used in the top bar, the footer and browser tabs." },
          { key: "full_name", label: "Full name", type: "text", max: 80, help: "Helps search engines connect the different spellings of your name." },
          localizedText("job_title", "Job title", { max: 80 }),
          { key: "available_for_freelance", label: "Available for freelance", type: "toggle", help: "Shows the green availability line in the hero." },
        ],
      },
    ],
  },
  images: {
    title: "Logos and default images",
    description: "Used wherever a page does not set its own image.",
    fieldsets: [
      {
        fields: [
          { key: "logo_mark_media_id", label: "Logo mark", type: "media", folder: "logo", help: "The symbol on its own, used in the top bar. Keep the transparent background." },
          { key: "logo_lockup_media_id", label: "Full logo", type: "media", folder: "logo", help: "Symbol and name together, used in the footer." },
          { key: "favicon_media_id", label: "Browser tab icon (favicon)", type: "media", folder: "logo", help: "A square image, 512 by 512 pixels if possible." },
          { key: "default_profile_media_id", label: "Default profile image", type: "media", folder: "profile", help: "Used to represent you to search engines." },
          { key: "default_og_media_id", label: "Default social sharing image", type: "media", folder: "other", help: "Shown when a page is shared on social media. 1200 by 630 pixels, JPG." },
        ],
      },
    ],
  },
  languages: {
    title: "Languages",
    description: "Which languages visitors can use.",
    fieldsets: [
      {
        fields: [
          { key: "default_locale", label: "Default language", type: "select", required: true, options: LANGUAGE_OPTIONS, help: "The language visitors land on first." },
          { key: "available_locales", label: "Available languages", type: "checklist", required: true, options: LANGUAGE_OPTIONS, help: "Turning a language off hides the language switch and sends its pages to the default language." },
        ],
      },
    ],
  },
  contact: {
    title: "Contact details",
    description: "Anything left empty stays hidden on the website.",
    fieldsets: [
      {
        fields: [
          { key: "contact_email", label: "Email", type: "email", placeholder: "hello@example.com", help: "When set, this becomes the main button in the Contact section." },
          { key: "contact_phone", label: "Phone", type: "phone", placeholder: "+20 100 123 4567" },
          { key: "contact_whatsapp", label: "WhatsApp number", type: "phone", placeholder: "+20 100 123 4567", help: "Include the country code. Visitors get a link that opens a chat." },
          localizedText("location", "Location", { max: 60 }),
          { key: "address_locality", label: "City, for search engines", type: "text", max: 60, placeholder: "Cairo" },
          { key: "address_country", label: "Country code, for search engines", type: "text", max: 2, placeholder: "EG" },
        ],
      },
    ],
  },
  seo: {
    title: "Search engine defaults",
    description: "Apply to every page unless a page sets its own.",
    fieldsets: [
      {
        fields: [
          {
            key: "title_template",
            label: "Browser tab title pattern",
            type: "text",
            required: true,
            max: 80,
            help: "%s is replaced with the page title. For example: %s | Yosra Elgohary",
          },
          { key: "allow_indexing", label: "Let search engines list this website", type: "toggle", help: "Turn off to hide the whole website from Google while it is not ready." },
          { key: "default_og_media_id", label: "Default social sharing image", type: "media", folder: "other", help: "1200 by 630 pixels, JPG." },
        ],
      },
    ],
  },
} satisfies Record<string, { title: string; description: string; fieldsets: Fieldset[] }>;

export type SettingsGroupKey = keyof typeof SETTINGS_GROUPS;

/* -------------------------------------------------------------------------- */
/*  SEO                                                                       */
/* -------------------------------------------------------------------------- */

export const SEO_PAGES = [
  { key: "home", label: "Homepage", path: "" },
  { key: "about", label: "About page", path: "/about" },
  { key: "services", label: "Services page", path: "/services" },
  { key: "projects", label: "Selected Work page", path: "/work" },
] as const;

export const SEO_FIELDSETS: Fieldset[] = [
  {
    title: "Search results",
    fields: [
      localizedText("title", "Title", { max: 70, help: "Around 50 to 60 characters shows in full on Google." }),
      localizedArea("description", "Description", { max: 200, help: "Around 150 characters shows in full on Google." }),
      { key: "noindex", label: "Hide this page from search engines", type: "toggle" },
      { key: "canonical_url", label: "Canonical address (optional)", type: "url", help: "Only needed if this content also lives at another address. Most pages leave this empty." },
    ],
  },
  {
    title: "When shared on social media",
    description: "Left empty, these use the search title and description.",
    fields: [
      localizedText("og_title", "Title", { max: 90 }),
      localizedArea("og_description", "Description", { max: 200 }),
      { key: "og_media_id", label: "Image", type: "media", folder: "other", help: "1200 by 630 pixels. Use a JPG, because some platforms do not show WebP. Left empty, a default image is used." },
    ],
  },
  {
    title: "X (Twitter)",
    description: "Left empty, these use the social media text above.",
    fields: [
      localizedText("twitter_title", "Title", { max: 70 }),
      localizedArea("twitter_description", "Description", { max: 200 }),
      {
        key: "twitter_card",
        label: "Card style",
        type: "select",
        options: [
          { value: "summary_large_image", label: "Large image" },
          { value: "summary", label: "Small image" },
        ],
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Projects                                                                  */
/* -------------------------------------------------------------------------- */

export const TILE_OPTIONS = [
  { value: "wide", label: "Wide: two thirds of the width, curved corner" },
  { value: "narrow", label: "Narrow: one third of the width, tall" },
  { value: "large", label: "Large: just over half the width" },
  { value: "medium", label: "Medium: just under half the width" },
  { value: "deck", label: "Deck: full width, three pages fanned out" },
  { value: "row", label: "Line in the video list" },
];

export const PROJECT_FIELDSETS = (categories: { value: string; label: string }[]): Record<string, Fieldset> => ({
  basics: {
    title: "Basics",
    fields: [
      localizedText("title", "Title", {
        required: true,
        max: 120,
        arabicOptional: true,
        help: "Text after “ | ” becomes a subtitle, for example: Main Title | Subtitle. If the Arabic is left empty, the English title is shown.",
      }),
      { key: "slug", label: "Web address", type: "slug", required: true, source: "title", help: "The end of the address: /work/this-part. Changing it breaks links people have already shared." },
      { key: "short_name", label: "Short name", type: "text", max: 40, help: "Used on small buttons, such as “Seen in” under a service." },
      { key: "category_id", label: "Category", type: "select", options: categories, allowEmpty: true },
      { key: "client", label: "Client", type: "text", max: 80 },
      { key: "behance_url", label: "Behance link", type: "url", placeholder: "https://www.behance.net/gallery/..." },
      localizedArea("short_description", "Short description", { max: 400, required: true, help: "Shown at the top of the project page and on the homepage." }),
    ],
  },
  story: {
    title: "Project story",
    description: "Everything here is optional. Sections left empty do not appear on the website.",
    fields: [
      localizedArea("full_description", "Full description", { rows: 5, max: 1500 }),
      localizedArea("context", "Brand or client context", { max: 800 }),
      localizedArea("objective", "Objective", { max: 800 }),
      localizedArea("direction", "Creative direction", { max: 800 }),
      localizedArea("strategy", "Strategy", { max: 800 }),
      localizedText("quote", "Pull quote", { max: 120, arabicOptional: true, help: "Shown large at the start of the details." }),
      {
        key: "highlights",
        label: "Key points",
        type: "list",
        itemLabel: "Key point",
        titleKey: "title",
        fields: [localizedText("title", "Title", { required: true, max: 50 }), localizedArea("text", "Text", { max: 300 })],
      },
      {
        key: "palette",
        label: "Color palette",
        type: "list",
        itemLabel: "Color",
        titleKey: "name",
        max: 8,
        fields: [
          { key: "name", label: "Name", type: "text", required: true, max: 40 },
          { key: "hex", label: "Color", type: "color", required: true },
          { key: "share", label: "Share of the palette", type: "text", max: 6, placeholder: "35%" },
        ],
      },
    ],
  },
  details: {
    title: "Your contribution",
    description: "Only list what you actually did on this project.",
    fields: [
      { key: "role", label: "Your role", type: "tags", localized: true, placeholder: "Add a role and press Enter" },
      { key: "deliverables", label: "Deliverables", type: "tags", localized: true, placeholder: "Add a deliverable and press Enter" },
      { key: "tools", label: "Tools", type: "tags", placeholder: "Add a tool and press Enter" },
    ],
  },
  display: {
    title: "How it appears",
    fields: [
      { key: "tile", label: "Size on the homepage", type: "select", required: true, options: TILE_OPTIONS },
      { key: "featured", label: "Mark as featured", type: "toggle", help: "Adds a small “Featured” tag." },
      { key: "is_video", label: "This is a video project", type: "toggle", help: "Adds a “Video” tag and a video frame on the project page." },
      {
        key: "video_media_id",
        label: "Video file (optional)",
        type: "media",
        folder: "video",
        kind: "video",
        help: "Plays on the website. Without one, the frame links to the Behance link above.",
      },
    ],
  },
  cover: {
    title: "Cover image",
    fields: [
      { key: "cover_media_id", label: "Cover image", type: "media", folder: "projects", help: "Required before a project can be published." },
      {
        key: "cover_background",
        label: "Background behind the cover (optional)",
        type: "color",
        help: "For a logo-only cover. The whole logo shows on this color instead of being cropped.",
      },
    ],
  },
});

export const ICON_OPTIONS = Object.entries(CMS_ICONS).map(([value, { label }]) => ({ value, label }));
