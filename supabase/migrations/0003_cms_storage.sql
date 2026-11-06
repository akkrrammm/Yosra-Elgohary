-- Portfolio CMS: file storage.
--
-- Buckets are public so images load fast through the CDN, but nobody except an
-- administrator can upload, replace, delete or list files. File names contain a
-- random id, so a file attached to a draft cannot be guessed.
--
-- The cms- prefix keeps these from colliding with any bucket already in the project.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'cms-images', 'cms-images', true, 15728640, -- 15 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
  ),
  (
    'cms-videos', 'cms-videos', true, 52428800, -- 50 MB, the default upload limit on the Supabase free plan
    array['video/mp4', 'video/webm']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "CMS admins list files" on storage.objects;
create policy "CMS admins list files" on storage.objects
  for select to authenticated
  using (bucket_id in ('cms-images', 'cms-videos') and (select public.is_admin()));

drop policy if exists "CMS admins upload files" on storage.objects;
create policy "CMS admins upload files" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('cms-images', 'cms-videos') and (select public.is_admin()));

drop policy if exists "CMS admins replace files" on storage.objects;
create policy "CMS admins replace files" on storage.objects
  for update to authenticated
  using (bucket_id in ('cms-images', 'cms-videos') and (select public.is_admin()))
  with check (bucket_id in ('cms-images', 'cms-videos') and (select public.is_admin()));

drop policy if exists "CMS admins delete files" on storage.objects;
create policy "CMS admins delete files" on storage.objects
  for delete to authenticated
  using (bucket_id in ('cms-images', 'cms-videos') and (select public.is_admin()));
