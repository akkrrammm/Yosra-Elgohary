/** Mirrors supabase/migrations. Keep the two in step when the schema changes. */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AdminRole = "owner" | "editor";
export type PublishStatus = "draft" | "published";
export type ProjectTile = "wide" | "narrow" | "deck" | "large" | "medium" | "row";
export type NavLocation = "header" | "footer";
export type MediaKind = "image" | "video";
export type MediaFolder = "profile" | "logo" | "projects" | "services" | "sections" | "video" | "other";
export type MediaBucket = "cms-images" | "cms-videos";
export type SeoPageKey = "home" | "about" | "services" | "projects";

/** Text in each language. A language that has not been written yet is simply absent. */
export type LocalizedText = { en?: string; ar?: string };
export type LocalizedList = { en?: string[]; ar?: string[] };
export type Highlight = { title: LocalizedText; text: LocalizedText };
export type PaletteColor = { name: string; hex: string; share: string };

export type AdminUserRow = {
  user_id: string;
  role: AdminRole;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

export type MediaRow = {
  id: string;
  bucket: MediaBucket;
  path: string;
  kind: MediaKind;
  folder: MediaFolder;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  original_name: string;
  alt: LocalizedText;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SettingsRow = {
  id: boolean;
  site_name: string;
  full_name: string;
  job_title: LocalizedText;
  location: LocalizedText;
  address_locality: string;
  address_country: string;
  available_for_freelance: boolean;
  default_locale: string;
  available_locales: string[];
  contact_email: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  logo_mark_media_id: string | null;
  logo_lockup_media_id: string | null;
  favicon_media_id: string | null;
  default_profile_media_id: string | null;
  default_og_media_id: string | null;
  title_template: string;
  allow_indexing: boolean;
  seeded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SectionRow = {
  key: string;
  content: Record<string, Json | undefined>;
  visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type SectionMediaRow = {
  section_key: string;
  slot: string;
  position: number;
  media_id: string;
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: LocalizedText;
  visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ProjectRow = {
  id: string;
  behance_id: string | null;
  slug: string;
  title: LocalizedText;
  short_name: string;
  short_description: LocalizedText;
  full_description: LocalizedText;
  category_id: string | null;
  client: string | null;
  cover_media_id: string | null;
  cover_background: string | null;
  context: LocalizedText;
  objective: LocalizedText;
  direction: LocalizedText;
  strategy: LocalizedText;
  quote: LocalizedText;
  highlights: Highlight[];
  palette: PaletteColor[];
  role: LocalizedList;
  deliverables: LocalizedList;
  tools: string[];
  is_video: boolean;
  video_media_id: string | null;
  tile: ProjectTile;
  behance_url: string | null;
  featured: boolean;
  status: PublishStatus;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GalleryRow = {
  id: string;
  project_id: string;
  media_id: string;
  caption: LocalizedText;
  display_order: number;
  deck_position: number | null;
  created_at: string;
};

export type WallRow = {
  id: string;
  gallery_item_id: string;
  row_index: number;
  display_order: number;
};

export type ServiceRow = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  icon: string | null;
  image_media_id: string | null;
  visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ServiceProjectRow = {
  service_id: string;
  project_id: string;
  display_order: number;
};

export type ProcessStepRow = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  icon: string | null;
  image_media_id: string | null;
  visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type AchievementRow = {
  id: string;
  value: string;
  label: LocalizedText;
  visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type SocialLinkRow = {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type NavigationRow = {
  id: string;
  location: NavLocation;
  label: LocalizedText;
  href: string;
  visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type SeoRow = {
  id: string;
  page_key: SeoPageKey | null;
  project_id: string | null;
  title: LocalizedText;
  description: LocalizedText;
  og_title: LocalizedText;
  og_description: LocalizedText;
  og_media_id: string | null;
  twitter_title: LocalizedText;
  twitter_description: LocalizedText;
  twitter_card: "summary" | "summary_large_image";
  canonical_url: string | null;
  noindex: boolean;
  created_at: string;
  updated_at: string;
};

type Table<Row, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

type MediaUsageRow = { area: string; label: string; href: string };

export type Database = {
  public: {
    Tables: {
      admin_users: Table<AdminUserRow, "user_id">;
      media_assets: Table<MediaRow, "bucket" | "path" | "mime_type" | "size_bytes">;
      site_settings: Table<SettingsRow, "site_name">;
      site_sections: Table<SectionRow, "key">;
      section_media: Table<SectionMediaRow, "section_key" | "slot" | "media_id">;
      project_categories: Table<CategoryRow, "slug" | "name">;
      projects: Table<ProjectRow, "slug" | "title">;
      project_gallery: Table<GalleryRow, "project_id" | "media_id">;
      wall_items: Table<WallRow, "gallery_item_id">;
      services: Table<ServiceRow, "name">;
      service_projects: Table<ServiceProjectRow, "service_id" | "project_id">;
      process_steps: Table<ProcessStepRow, "title">;
      achievements: Table<AchievementRow, "value" | "label">;
      social_links: Table<SocialLinkRow, "label" | "url">;
      navigation_items: Table<NavigationRow, "label" | "href">;
      seo_metadata: Table<SeoRow>;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      save_section: {
        Args: { p_key: string; p_content: Json; p_media?: Json; p_visible?: boolean };
        Returns: undefined;
      };
      reorder_rows: { Args: { p_table: string; p_ids: string[] }; Returns: undefined };
      reorder_sections: { Args: { p_keys: string[] }; Returns: undefined };
      save_project: {
        Args: { p_id: string | null; p_project: Json; p_gallery: Json | null; p_seo: Json | null };
        Returns: string;
      };
      duplicate_project: { Args: { p_id: string }; Returns: string };
      save_wall: { Args: { p_items: Json }; Returns: undefined };
      media_usage: { Args: { p_media_id: string }; Returns: MediaUsageRow[] };
      media_usage_counts: { Args: { p_ids: string[] }; Returns: { media_id: string; uses: number }[] };
    };
    Enums: {
      admin_role: AdminRole;
      publish_status: PublishStatus;
      project_tile: ProjectTile;
      nav_location: NavLocation;
      media_kind: MediaKind;
      media_folder: MediaFolder;
    };
    CompositeTypes: Record<string, never>;
  };
};
