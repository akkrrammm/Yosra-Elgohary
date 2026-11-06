-- Portfolio CMS: tables, constraints, indexes and triggers.
--
-- Safe to run more than once. Everything is guarded with IF NOT EXISTS or
-- equivalent, and nothing here drops or overwrites existing tables or data.
--
-- Localized text is stored as {"en": "...", "ar": "..."}. Missing languages are
-- simply absent, so the site can fall back without one language overwriting the other.

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

do $$ begin
  create type public.admin_role as enum ('owner', 'editor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.publish_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.project_tile as enum ('wide', 'narrow', 'deck', 'large', 'medium', 'row');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.nav_location as enum ('header', 'footer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.media_kind as enum ('image', 'video');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.media_folder as enum ('profile', 'logo', 'projects', 'services', 'sections', 'video', 'other');
exception when duplicate_object then null; end $$;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- {"en": "text", "ar": "text"}, with either language allowed to be absent.
create or replace function public.is_localized_text(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'object'
    and not exists (
      select 1
      from jsonb_each(value) as item
      where item.key not in ('en', 'ar') or jsonb_typeof(item.value) <> 'string'
    );
$$;

-- {"en": ["one", "two"], "ar": ["..."]}
create or replace function public.is_localized_list(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'object'
    and not exists (
      select 1
      from jsonb_each(value) as item
      where item.key not in ('en', 'ar') or jsonb_typeof(item.value) <> 'array'
    );
$$;

/* -------------------------------------------------------------------------- */
/*  Administrators                                                            */
/* -------------------------------------------------------------------------- */

-- Being signed in grants nothing. Only a row here makes someone an administrator.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.admin_role not null default 'editor',
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

/* -------------------------------------------------------------------------- */
/*  Media library                                                             */
/* -------------------------------------------------------------------------- */

-- Files live in Supabase Storage. This table holds only their metadata.
-- Everything that uses a file references it with ON DELETE RESTRICT, so the
-- database itself refuses to delete a file that is still in use.
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null check (bucket in ('cms-images', 'cms-videos')),
  path text not null check (length(path) > 0),
  kind public.media_kind not null default 'image',
  folder public.media_folder not null default 'other',
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  original_name text not null default '',
  alt jsonb not null default '{}'::jsonb check (public.is_localized_text(alt)),
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, path)
);

create index if not exists media_assets_folder_idx on public.media_assets (folder, created_at desc);
create index if not exists media_assets_created_idx on public.media_assets (created_at desc);

/* -------------------------------------------------------------------------- */
/*  Global settings (one row)                                                 */
/* -------------------------------------------------------------------------- */

create table if not exists public.site_settings (
  id boolean primary key default true check (id),
  site_name text not null,
  full_name text not null default '',
  job_title jsonb not null default '{}'::jsonb check (public.is_localized_text(job_title)),
  location jsonb not null default '{}'::jsonb check (public.is_localized_text(location)),
  address_locality text not null default '',
  address_country text not null default '',
  available_for_freelance boolean not null default false,
  default_locale text not null default 'en' check (default_locale in ('en', 'ar')),
  available_locales text[] not null default array['en', 'ar']
    check (array_length(available_locales, 1) >= 1 and available_locales <@ array['en', 'ar']),
  contact_email text,
  contact_phone text,
  contact_whatsapp text,
  logo_mark_media_id uuid references public.media_assets (id) on delete restrict,
  logo_lockup_media_id uuid references public.media_assets (id) on delete restrict,
  favicon_media_id uuid references public.media_assets (id) on delete restrict,
  default_profile_media_id uuid references public.media_assets (id) on delete restrict,
  default_og_media_id uuid references public.media_assets (id) on delete restrict,
  title_template text not null default '%s',
  allow_indexing boolean not null default true,
  seeded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (default_locale = any (available_locales))
);

/* -------------------------------------------------------------------------- */
/*  Page sections                                                             */
/* -------------------------------------------------------------------------- */

-- One row per block of content (hero, about, contact and so on).
-- The fields inside `content` are defined and validated in lib/cms/definitions.
create table if not exists public.site_sections (
  key text primary key check (key ~ '^[a-z][a-z_]*$'),
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.section_media (
  section_key text not null references public.site_sections (key) on delete cascade,
  slot text not null check (length(slot) > 0),
  position integer not null default 0 check (position >= 0),
  media_id uuid not null references public.media_assets (id) on delete restrict,
  primary key (section_key, slot, position)
);

create index if not exists section_media_media_idx on public.section_media (media_id);

/* -------------------------------------------------------------------------- */
/*  Projects                                                                  */
/* -------------------------------------------------------------------------- */

create table if not exists public.project_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_localized_text(name) and coalesce(name ->> 'en', '') <> ''),
  visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  behance_id text unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title jsonb not null check (public.is_localized_text(title) and coalesce(title ->> 'en', '') <> ''),
  short_name text not null default '',
  short_description jsonb not null default '{}'::jsonb check (public.is_localized_text(short_description)),
  full_description jsonb not null default '{}'::jsonb check (public.is_localized_text(full_description)),
  category_id uuid references public.project_categories (id) on delete restrict,
  client text,
  cover_media_id uuid references public.media_assets (id) on delete restrict,
  cover_background text check (cover_background is null or cover_background ~ '^#[0-9a-fA-F]{6}$'),
  context jsonb not null default '{}'::jsonb check (public.is_localized_text(context)),
  objective jsonb not null default '{}'::jsonb check (public.is_localized_text(objective)),
  direction jsonb not null default '{}'::jsonb check (public.is_localized_text(direction)),
  strategy jsonb not null default '{}'::jsonb check (public.is_localized_text(strategy)),
  quote jsonb not null default '{}'::jsonb check (public.is_localized_text(quote)),
  highlights jsonb not null default '[]'::jsonb check (jsonb_typeof(highlights) = 'array'),
  palette jsonb not null default '[]'::jsonb check (jsonb_typeof(palette) = 'array'),
  role jsonb not null default '{}'::jsonb check (public.is_localized_list(role)),
  deliverables jsonb not null default '{}'::jsonb check (public.is_localized_list(deliverables)),
  tools text[] not null default '{}',
  is_video boolean not null default false,
  video_media_id uuid references public.media_assets (id) on delete restrict,
  tile public.project_tile not null default 'medium',
  behance_url text check (behance_url is null or behance_url ~ '^https?://'),
  featured boolean not null default false,
  status public.publish_status not null default 'draft',
  display_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A published project always has something to show.
  constraint projects_published_needs_cover check (status = 'draft' or cover_media_id is not null)
);

create index if not exists projects_public_idx on public.projects (status, display_order);
create index if not exists projects_category_idx on public.projects (category_id);
create index if not exists projects_cover_idx on public.projects (cover_media_id);
create index if not exists projects_video_idx on public.projects (video_media_id);

create table if not exists public.project_gallery (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  media_id uuid not null references public.media_assets (id) on delete restrict,
  caption jsonb not null default '{}'::jsonb check (public.is_localized_text(caption)),
  display_order integer not null default 0,
  deck_position smallint check (deck_position is null or deck_position between 1 and 3),
  created_at timestamptz not null default now(),
  unique (project_id, media_id)
);

create index if not exists project_gallery_project_idx on public.project_gallery (project_id, display_order);
create index if not exists project_gallery_media_idx on public.project_gallery (media_id);
create unique index if not exists project_gallery_deck_idx
  on public.project_gallery (project_id, deck_position)
  where deck_position is not null;

-- The two rows of pages drifting across the homepage.
create table if not exists public.wall_items (
  id uuid primary key default gen_random_uuid(),
  gallery_item_id uuid not null unique references public.project_gallery (id) on delete cascade,
  row_index smallint not null default 0 check (row_index in (0, 1)),
  display_order integer not null default 0
);

create index if not exists wall_items_row_idx on public.wall_items (row_index, display_order);

/* -------------------------------------------------------------------------- */
/*  Services, process, achievements                                           */
/* -------------------------------------------------------------------------- */

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null check (public.is_localized_text(name) and coalesce(name ->> 'en', '') <> ''),
  description jsonb not null default '{}'::jsonb check (public.is_localized_text(description)),
  icon text,
  image_media_id uuid references public.media_assets (id) on delete restrict,
  visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_public_idx on public.services (visible, display_order);
create index if not exists services_image_idx on public.services (image_media_id);

-- The projects shown as proof of a service ("Seen in").
create table if not exists public.service_projects (
  service_id uuid not null references public.services (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  display_order integer not null default 0,
  primary key (service_id, project_id)
);

create index if not exists service_projects_project_idx on public.service_projects (project_id);

create table if not exists public.process_steps (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null check (public.is_localized_text(title) and coalesce(title ->> 'en', '') <> ''),
  description jsonb not null default '{}'::jsonb check (public.is_localized_text(description)),
  icon text,
  image_media_id uuid references public.media_assets (id) on delete restrict,
  visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists process_steps_public_idx on public.process_steps (visible, display_order);
create index if not exists process_steps_image_idx on public.process_steps (image_media_id);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  value text not null check (length(value) > 0),
  label jsonb not null check (public.is_localized_text(label) and coalesce(label ->> 'en', '') <> ''),
  visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists achievements_public_idx on public.achievements (visible, display_order);

/* -------------------------------------------------------------------------- */
/*  Links                                                                     */
/* -------------------------------------------------------------------------- */

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(label) > 0),
  url text not null check (url ~ '^https?://'),
  icon text,
  visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  location public.nav_location not null default 'header',
  label jsonb not null check (public.is_localized_text(label) and coalesce(label ->> 'en', '') <> ''),
  href text not null check (href ~ '^(#|/|https?://|mailto:|tel:)'),
  visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists navigation_items_location_idx on public.navigation_items (location, display_order);

/* -------------------------------------------------------------------------- */
/*  SEO                                                                       */
/* -------------------------------------------------------------------------- */

-- One row per page (page_key) or per project (project_id), never both.
create table if not exists public.seo_metadata (
  id uuid primary key default gen_random_uuid(),
  page_key text unique check (page_key in ('home', 'about', 'services', 'projects')),
  project_id uuid unique references public.projects (id) on delete cascade,
  title jsonb not null default '{}'::jsonb check (public.is_localized_text(title)),
  description jsonb not null default '{}'::jsonb check (public.is_localized_text(description)),
  og_title jsonb not null default '{}'::jsonb check (public.is_localized_text(og_title)),
  og_description jsonb not null default '{}'::jsonb check (public.is_localized_text(og_description)),
  og_media_id uuid references public.media_assets (id) on delete restrict,
  twitter_title jsonb not null default '{}'::jsonb check (public.is_localized_text(twitter_title)),
  twitter_description jsonb not null default '{}'::jsonb check (public.is_localized_text(twitter_description)),
  twitter_card text not null default 'summary_large_image' check (twitter_card in ('summary', 'summary_large_image')),
  canonical_url text check (canonical_url is null or canonical_url ~ '^https?://'),
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seo_metadata_one_target check ((page_key is null) <> (project_id is null))
);

create index if not exists seo_metadata_og_idx on public.seo_metadata (og_media_id);

/* -------------------------------------------------------------------------- */
/*  Triggers                                                                  */
/* -------------------------------------------------------------------------- */

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'admin_users', 'media_assets', 'site_settings', 'site_sections', 'project_categories',
    'projects', 'services', 'process_steps', 'achievements', 'social_links',
    'navigation_items', 'seo_metadata'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      table_name
    );
  end loop;
end $$;

-- Remembers when a project first went public.
create or replace function public.set_project_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists set_published_at on public.projects;
create trigger set_published_at
  before insert or update of status on public.projects
  for each row execute function public.set_project_published_at();
