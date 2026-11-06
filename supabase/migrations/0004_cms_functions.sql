-- Portfolio CMS: operations that must succeed or fail as a whole.
--
-- All of these run as the calling user (SECURITY INVOKER), so Row Level Security
-- still applies. The is_admin check is there to give a clear error instead of a
-- silent "0 rows changed".

create or replace function public.assert_admin()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can do this.' using errcode = '42501';
  end if;
end;
$$;

-- Revoked from anon by name as well as from public: Supabase grants new functions to anon directly.
revoke all on function public.assert_admin() from public, anon;
grant execute on function public.assert_admin() to authenticated, service_role;

/* -------------------------------------------------------------------------- */
/*  Sections                                                                  */
/* -------------------------------------------------------------------------- */

-- Saves a section's content and its images together.
-- p_media: [{"slot": "portrait", "position": 0, "media_id": "..."}]
create or replace function public.save_section(
  p_key text,
  p_content jsonb,
  p_media jsonb default null,
  p_visible boolean default null
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform public.assert_admin();

  insert into public.site_sections (key, content, visible)
  values (p_key, p_content, coalesce(p_visible, true))
  on conflict (key) do update
    set content = excluded.content,
        visible = coalesce(p_visible, public.site_sections.visible);

  if p_media is not null then
    delete from public.section_media where section_key = p_key;

    insert into public.section_media (section_key, slot, position, media_id)
    select p_key, item ->> 'slot', (item ->> 'position')::integer, (item ->> 'media_id')::uuid
    from jsonb_array_elements(p_media) as item;
  end if;
end;
$$;

revoke all on function public.save_section(text, jsonb, jsonb, boolean) from public, anon;
grant execute on function public.save_section(text, jsonb, jsonb, boolean) to authenticated, service_role;

/* -------------------------------------------------------------------------- */
/*  Ordering                                                                  */
/* -------------------------------------------------------------------------- */

create or replace function public.reorder_rows(p_table text, p_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform public.assert_admin();

  if p_table not in (
    'projects', 'project_categories', 'services', 'process_steps',
    'achievements', 'social_links', 'navigation_items'
  ) then
    raise exception 'This list cannot be reordered: %', p_table using errcode = '22023';
  end if;

  execute format(
    'update public.%I as t
     set display_order = o.position - 1
     from unnest($1) with ordinality as o (id, position)
     where t.id = o.id',
    p_table
  ) using p_ids;
end;
$$;

revoke all on function public.reorder_rows(text, uuid[]) from public, anon;
grant execute on function public.reorder_rows(text, uuid[]) to authenticated, service_role;

create or replace function public.reorder_sections(p_keys text[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform public.assert_admin();

  update public.site_sections as s
  set display_order = o.position - 1
  from unnest(p_keys) with ordinality as o (key, position)
  where s.key = o.key;
end;
$$;

revoke all on function public.reorder_sections(text[]) from public, anon;
grant execute on function public.reorder_sections(text[]) to authenticated, service_role;

/* -------------------------------------------------------------------------- */
/*  Projects                                                                  */
/* -------------------------------------------------------------------------- */

-- Creates or updates a project together with its gallery and SEO.
-- Gallery rows are kept by media id, so a project's pages on the homepage wall survive saving.
create or replace function public.save_project(
  p_id uuid,
  p_project jsonb,
  p_gallery jsonb,
  p_seo jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid := p_id;
begin
  perform public.assert_admin();

  if v_id is null then
    insert into public.projects (
      behance_id, slug, title, short_name, short_description, full_description, category_id, client,
      cover_media_id, cover_background, context, objective, direction, strategy, quote, highlights,
      palette, role, deliverables, tools, is_video, video_media_id, tile, behance_url, featured,
      status, display_order
    )
    values (
      nullif(p_project ->> 'behance_id', ''),
      p_project ->> 'slug',
      p_project -> 'title',
      coalesce(p_project ->> 'short_name', ''),
      coalesce(p_project -> 'short_description', '{}'::jsonb),
      coalesce(p_project -> 'full_description', '{}'::jsonb),
      nullif(p_project ->> 'category_id', '')::uuid,
      nullif(p_project ->> 'client', ''),
      nullif(p_project ->> 'cover_media_id', '')::uuid,
      nullif(p_project ->> 'cover_background', ''),
      coalesce(p_project -> 'context', '{}'::jsonb),
      coalesce(p_project -> 'objective', '{}'::jsonb),
      coalesce(p_project -> 'direction', '{}'::jsonb),
      coalesce(p_project -> 'strategy', '{}'::jsonb),
      coalesce(p_project -> 'quote', '{}'::jsonb),
      coalesce(p_project -> 'highlights', '[]'::jsonb),
      coalesce(p_project -> 'palette', '[]'::jsonb),
      coalesce(p_project -> 'role', '{}'::jsonb),
      coalesce(p_project -> 'deliverables', '{}'::jsonb),
      array(select jsonb_array_elements_text(coalesce(p_project -> 'tools', '[]'::jsonb))),
      coalesce((p_project ->> 'is_video')::boolean, false),
      nullif(p_project ->> 'video_media_id', '')::uuid,
      coalesce(p_project ->> 'tile', 'medium')::public.project_tile,
      nullif(p_project ->> 'behance_url', ''),
      coalesce((p_project ->> 'featured')::boolean, false),
      coalesce(p_project ->> 'status', 'draft')::public.publish_status,
      coalesce((select max(display_order) + 1 from public.projects), 0)
    )
    returning id into v_id;
  else
    update public.projects set
      -- The form has no field for this, so a save without one must not erase it.
      behance_id = coalesce(nullif(p_project ->> 'behance_id', ''), behance_id),
      slug = p_project ->> 'slug',
      title = p_project -> 'title',
      short_name = coalesce(p_project ->> 'short_name', ''),
      short_description = coalesce(p_project -> 'short_description', '{}'::jsonb),
      full_description = coalesce(p_project -> 'full_description', '{}'::jsonb),
      category_id = nullif(p_project ->> 'category_id', '')::uuid,
      client = nullif(p_project ->> 'client', ''),
      cover_media_id = nullif(p_project ->> 'cover_media_id', '')::uuid,
      cover_background = nullif(p_project ->> 'cover_background', ''),
      context = coalesce(p_project -> 'context', '{}'::jsonb),
      objective = coalesce(p_project -> 'objective', '{}'::jsonb),
      direction = coalesce(p_project -> 'direction', '{}'::jsonb),
      strategy = coalesce(p_project -> 'strategy', '{}'::jsonb),
      quote = coalesce(p_project -> 'quote', '{}'::jsonb),
      highlights = coalesce(p_project -> 'highlights', '[]'::jsonb),
      palette = coalesce(p_project -> 'palette', '[]'::jsonb),
      role = coalesce(p_project -> 'role', '{}'::jsonb),
      deliverables = coalesce(p_project -> 'deliverables', '{}'::jsonb),
      tools = array(select jsonb_array_elements_text(coalesce(p_project -> 'tools', '[]'::jsonb))),
      is_video = coalesce((p_project ->> 'is_video')::boolean, false),
      video_media_id = nullif(p_project ->> 'video_media_id', '')::uuid,
      tile = coalesce(p_project ->> 'tile', 'medium')::public.project_tile,
      behance_url = nullif(p_project ->> 'behance_url', ''),
      featured = coalesce((p_project ->> 'featured')::boolean, false),
      status = coalesce(p_project ->> 'status', 'draft')::public.publish_status
    where id = v_id;

    if not found then
      raise exception 'This project no longer exists.' using errcode = 'P0002';
    end if;
  end if;

  -- Gallery: [{"media_id": "...", "caption": {...}, "deck_position": 1}], in display order.
  if p_gallery is not null then
    delete from public.project_gallery g
    where g.project_id = v_id
      and g.media_id not in (
        select (item ->> 'media_id')::uuid from jsonb_array_elements(p_gallery) as item
      );

    -- Cleared first so swapping deck positions cannot trip the unique index midway.
    update public.project_gallery set deck_position = null where project_id = v_id;

    insert into public.project_gallery (project_id, media_id, caption, display_order, deck_position)
    select
      v_id,
      (item.value ->> 'media_id')::uuid,
      coalesce(item.value -> 'caption', '{}'::jsonb),
      item.ordinality - 1,
      nullif(item.value ->> 'deck_position', '')::smallint
    from jsonb_array_elements(p_gallery) with ordinality as item
    on conflict (project_id, media_id) do update
      set caption = excluded.caption,
          display_order = excluded.display_order,
          deck_position = excluded.deck_position;
  end if;

  if p_seo is not null then
    insert into public.seo_metadata (
      project_id, title, description, og_title, og_description, og_media_id,
      twitter_title, twitter_description, twitter_card, canonical_url, noindex
    )
    values (
      v_id,
      coalesce(p_seo -> 'title', '{}'::jsonb),
      coalesce(p_seo -> 'description', '{}'::jsonb),
      coalesce(p_seo -> 'og_title', '{}'::jsonb),
      coalesce(p_seo -> 'og_description', '{}'::jsonb),
      nullif(p_seo ->> 'og_media_id', '')::uuid,
      coalesce(p_seo -> 'twitter_title', '{}'::jsonb),
      coalesce(p_seo -> 'twitter_description', '{}'::jsonb),
      coalesce(p_seo ->> 'twitter_card', 'summary_large_image'),
      nullif(p_seo ->> 'canonical_url', ''),
      coalesce((p_seo ->> 'noindex')::boolean, false)
    )
    on conflict (project_id) do update set
      title = excluded.title,
      description = excluded.description,
      og_title = excluded.og_title,
      og_description = excluded.og_description,
      og_media_id = excluded.og_media_id,
      twitter_title = excluded.twitter_title,
      twitter_description = excluded.twitter_description,
      twitter_card = excluded.twitter_card,
      canonical_url = excluded.canonical_url,
      noindex = excluded.noindex;
  end if;

  return v_id;
end;
$$;

revoke all on function public.save_project(uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_project(uuid, jsonb, jsonb, jsonb) to authenticated, service_role;

-- Copies a project with its gallery and SEO. The copy always starts as a draft.
create or replace function public.duplicate_project(p_id uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_source public.projects;
  v_slug text;
  v_new_id uuid;
  v_suffix integer := 1;
begin
  perform public.assert_admin();

  select * into v_source from public.projects where id = p_id;
  if not found then
    raise exception 'This project no longer exists.' using errcode = 'P0002';
  end if;

  v_slug := v_source.slug || '-copy';
  while exists (select 1 from public.projects where slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := v_source.slug || '-copy-' || v_suffix;
  end loop;

  insert into public.projects (
    slug, title, short_name, short_description, full_description, category_id, client,
    cover_media_id, cover_background, context, objective, direction, strategy, quote, highlights,
    palette, role, deliverables, tools, is_video, video_media_id, tile, behance_url, featured,
    status, display_order
  )
  values (
    v_slug,
    v_source.title || jsonb_build_object('en', (v_source.title ->> 'en') || ' (copy)'),
    v_source.short_name, v_source.short_description, v_source.full_description, v_source.category_id, v_source.client,
    v_source.cover_media_id, v_source.cover_background, v_source.context, v_source.objective, v_source.direction,
    v_source.strategy, v_source.quote, v_source.highlights, v_source.palette, v_source.role, v_source.deliverables,
    v_source.tools, v_source.is_video, v_source.video_media_id, v_source.tile, v_source.behance_url, false,
    'draft',
    coalesce((select max(display_order) + 1 from public.projects), 0)
  )
  returning id into v_new_id;

  insert into public.project_gallery (project_id, media_id, caption, display_order, deck_position)
  select v_new_id, media_id, caption, display_order, deck_position
  from public.project_gallery
  where project_id = p_id;

  insert into public.seo_metadata (
    project_id, title, description, og_title, og_description, og_media_id,
    twitter_title, twitter_description, twitter_card, canonical_url, noindex
  )
  select
    v_new_id, title, description, og_title, og_description, og_media_id,
    twitter_title, twitter_description, twitter_card, null, noindex
  from public.seo_metadata
  where project_id = p_id;

  return v_new_id;
end;
$$;

revoke all on function public.duplicate_project(uuid) from public, anon;
grant execute on function public.duplicate_project(uuid) to authenticated, service_role;

-- Replaces the pages on the homepage wall in one step.
-- p_items: [{"gallery_item_id": "...", "row_index": 0}], in display order.
create or replace function public.save_wall(p_items jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform public.assert_admin();

  delete from public.wall_items where true;

  insert into public.wall_items (gallery_item_id, row_index, display_order)
  select
    (item.value ->> 'gallery_item_id')::uuid,
    (item.value ->> 'row_index')::smallint,
    item.ordinality - 1
  from jsonb_array_elements(p_items) with ordinality as item;
end;
$$;

revoke all on function public.save_wall(jsonb) from public, anon;
grant execute on function public.save_wall(jsonb) to authenticated, service_role;

/* -------------------------------------------------------------------------- */
/*  Media usage                                                               */
/* -------------------------------------------------------------------------- */

-- Where a file is used, in words an editor understands.
create or replace function public.media_usage(p_media_id uuid)
returns table (area text, label text, href text)
language plpgsql
stable
set search_path = ''
as $$
begin
  perform public.assert_admin();

  return query
    select 'Website settings'::text, c.label, '/admin/settings'::text
    from public.site_settings s
    cross join lateral (values
      (s.logo_mark_media_id, 'Logo mark'),
      (s.logo_lockup_media_id, 'Full logo'),
      (s.favicon_media_id, 'Favicon'),
      (s.default_profile_media_id, 'Default profile image'),
      (s.default_og_media_id, 'Default social sharing image')
    ) as c (media_id, label)
    where c.media_id = p_media_id

    union all
    select
      'Page section'::text,
      initcap(sm.section_key) || ' (' || sm.slot || ')',
      case sm.section_key
        when 'about' then '/admin/about'
        when 'process' then '/admin/process'
        when 'contact' then '/admin/contact'
        else '/admin/homepage'
      end
    from public.section_media sm
    where sm.media_id = p_media_id

    union all
    select 'Project cover'::text, p.title ->> 'en', '/admin/projects/' || p.id
    from public.projects p
    where p.cover_media_id = p_media_id

    union all
    select 'Project video'::text, p.title ->> 'en', '/admin/projects/' || p.id
    from public.projects p
    where p.video_media_id = p_media_id

    union all
    select 'Project gallery'::text, p.title ->> 'en', '/admin/projects/' || p.id
    from public.project_gallery g
    join public.projects p on p.id = g.project_id
    where g.media_id = p_media_id

    union all
    select 'Service'::text, s.name ->> 'en', '/admin/services'::text
    from public.services s
    where s.image_media_id = p_media_id

    union all
    select 'Process step'::text, s.title ->> 'en', '/admin/process'::text
    from public.process_steps s
    where s.image_media_id = p_media_id

    union all
    select
      'SEO'::text,
      coalesce(m.page_key, p.title ->> 'en'),
      case when m.page_key is not null then '/admin/seo' else '/admin/projects/' || p.id end
    from public.seo_metadata m
    left join public.projects p on p.id = m.project_id
    where m.og_media_id = p_media_id;
end;
$$;

revoke all on function public.media_usage(uuid) from public, anon;
grant execute on function public.media_usage(uuid) to authenticated, service_role;

-- How many places use each file, for the media library grid.
create or replace function public.media_usage_counts(p_ids uuid[])
returns table (media_id uuid, uses bigint)
language plpgsql
stable
set search_path = ''
as $$
begin
  perform public.assert_admin();

  return query
    select used.media_id, count(*)::bigint
    from (
      select unnest(array[
        s.logo_mark_media_id, s.logo_lockup_media_id, s.favicon_media_id,
        s.default_profile_media_id, s.default_og_media_id
      ]) as media_id
      from public.site_settings s
      union all select sm.media_id from public.section_media sm
      union all select p.cover_media_id from public.projects p
      union all select p.video_media_id from public.projects p
      union all select g.media_id from public.project_gallery g
      union all select s.image_media_id from public.services s
      union all select s.image_media_id from public.process_steps s
      union all select m.og_media_id from public.seo_metadata m
    ) as used
    where used.media_id = any (p_ids)
    group by used.media_id;
end;
$$;

revoke all on function public.media_usage_counts(uuid[]) from public, anon;
grant execute on function public.media_usage_counts(uuid[]) to authenticated, service_role;
