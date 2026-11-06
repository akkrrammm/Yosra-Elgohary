-- Portfolio CMS: who can read and write what. Enforced by the database, never by the frontend.
--
-- Visitors (anon) can read published content only.
-- Signed-in users who are not in admin_users get exactly the same access as visitors.
-- Administrators can read and change everything.

/* -------------------------------------------------------------------------- */
/*  Role checks                                                               */
/* -------------------------------------------------------------------------- */

-- SECURITY DEFINER so these can read admin_users without being blocked by its own policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'owner');
$$;

-- Revoked from anon by name as well as from public: Supabase grants new functions to anon directly.
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.is_owner() to authenticated, service_role;

-- A file is public only while something published uses it, so the metadata of
-- files attached to drafts stays private.
create or replace function public.media_is_public(p_media_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.site_settings s
      where p_media_id in (
        s.logo_mark_media_id, s.logo_lockup_media_id, s.favicon_media_id,
        s.default_profile_media_id, s.default_og_media_id
      )
    )
    or exists (
      select 1 from public.section_media sm
      join public.site_sections sec on sec.key = sm.section_key
      where sm.media_id = p_media_id and sec.visible
    )
    or exists (
      select 1 from public.projects p
      where p.status = 'published' and p_media_id in (p.cover_media_id, p.video_media_id)
    )
    or exists (
      select 1 from public.project_gallery g
      join public.projects p on p.id = g.project_id
      where g.media_id = p_media_id and p.status = 'published'
    )
    or exists (select 1 from public.services s where s.image_media_id = p_media_id and s.visible)
    or exists (select 1 from public.process_steps s where s.image_media_id = p_media_id and s.visible)
    or exists (
      select 1 from public.seo_metadata m
      left join public.projects p on p.id = m.project_id
      where m.og_media_id = p_media_id and (m.page_key is not null or p.status = 'published')
    );
$$;

revoke all on function public.media_is_public(uuid) from public;
grant execute on function public.media_is_public(uuid) to anon, authenticated, service_role;

/* -------------------------------------------------------------------------- */
/*  Table access                                                              */
/* -------------------------------------------------------------------------- */

-- Row Level Security on every table, and full access for administrators on all of them.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'media_assets', 'site_settings', 'site_sections', 'section_media', 'project_categories',
    'projects', 'project_gallery', 'wall_items', 'services', 'service_projects', 'process_steps',
    'achievements', 'social_links', 'navigation_items', 'seo_metadata'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select on public.%I to anon, authenticated', table_name);
    execute format('grant insert, update, delete on public.%I to authenticated', table_name);
    execute format('grant all on public.%I to service_role', table_name);
    execute format('drop policy if exists "Admins manage everything" on public.%I', table_name);
    execute format(
      'create policy "Admins manage everything" on public.%I
       for all to authenticated
       using ((select public.is_admin()))
       with check ((select public.is_admin()))',
      table_name
    );
  end loop;
end $$;

/* -------------------------------------------------------------------------- */
/*  What visitors can read                                                    */
/* -------------------------------------------------------------------------- */

drop policy if exists "Public reads files in use" on public.media_assets;
create policy "Public reads files in use" on public.media_assets
  for select to anon, authenticated
  using (public.media_is_public(id));

drop policy if exists "Public reads settings" on public.site_settings;
create policy "Public reads settings" on public.site_settings
  for select to anon, authenticated
  using (true);

drop policy if exists "Public reads visible sections" on public.site_sections;
create policy "Public reads visible sections" on public.site_sections
  for select to anon, authenticated
  using (visible);

drop policy if exists "Public reads media of visible sections" on public.section_media;
create policy "Public reads media of visible sections" on public.section_media
  for select to anon, authenticated
  using (exists (
    select 1 from public.site_sections s where s.key = section_key and s.visible
  ));

drop policy if exists "Public reads visible categories" on public.project_categories;
create policy "Public reads visible categories" on public.project_categories
  for select to anon, authenticated
  using (visible);

drop policy if exists "Public reads published projects" on public.projects;
create policy "Public reads published projects" on public.projects
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists "Public reads galleries of published projects" on public.project_gallery;
create policy "Public reads galleries of published projects" on public.project_gallery
  for select to anon, authenticated
  using (exists (
    select 1 from public.projects p where p.id = project_id and p.status = 'published'
  ));

drop policy if exists "Public reads wall items of published projects" on public.wall_items;
create policy "Public reads wall items of published projects" on public.wall_items
  for select to anon, authenticated
  using (exists (
    select 1 from public.project_gallery g
    join public.projects p on p.id = g.project_id
    where g.id = gallery_item_id and p.status = 'published'
  ));

drop policy if exists "Public reads visible services" on public.services;
create policy "Public reads visible services" on public.services
  for select to anon, authenticated
  using (visible);

drop policy if exists "Public reads proof of visible services" on public.service_projects;
create policy "Public reads proof of visible services" on public.service_projects
  for select to anon, authenticated
  using (
    exists (select 1 from public.services s where s.id = service_id and s.visible)
    and exists (select 1 from public.projects p where p.id = project_id and p.status = 'published')
  );

drop policy if exists "Public reads visible steps" on public.process_steps;
create policy "Public reads visible steps" on public.process_steps
  for select to anon, authenticated
  using (visible);

drop policy if exists "Public reads visible achievements" on public.achievements;
create policy "Public reads visible achievements" on public.achievements
  for select to anon, authenticated
  using (visible);

drop policy if exists "Public reads visible social links" on public.social_links;
create policy "Public reads visible social links" on public.social_links
  for select to anon, authenticated
  using (visible);

drop policy if exists "Public reads visible navigation" on public.navigation_items;
create policy "Public reads visible navigation" on public.navigation_items
  for select to anon, authenticated
  using (visible);

drop policy if exists "Public reads SEO of public pages" on public.seo_metadata;
create policy "Public reads SEO of public pages" on public.seo_metadata
  for select to anon, authenticated
  using (
    page_key is not null
    or exists (select 1 from public.projects p where p.id = project_id and p.status = 'published')
  );

/* -------------------------------------------------------------------------- */
/*  Administrators table                                                      */
/* -------------------------------------------------------------------------- */

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
grant insert, update, delete on public.admin_users to authenticated;
grant all on public.admin_users to service_role;

drop policy if exists "Admins see themselves and each other" on public.admin_users;
create policy "Admins see themselves and each other" on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Owners manage administrators" on public.admin_users;
create policy "Owners manage administrators" on public.admin_users
  for all to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

/* -------------------------------------------------------------------------- */
/*  Helper functions used by constraints                                      */
/* -------------------------------------------------------------------------- */

grant execute on function public.is_localized_text(jsonb) to anon, authenticated, service_role;
grant execute on function public.is_localized_list(jsonb) to anon, authenticated, service_role;
