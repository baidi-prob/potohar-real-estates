-- =====================================================================
-- 0003_storage.sql
-- Public 'property-images' bucket for listing photos.
-- Everyone can view images; only authenticated users can upload;
-- users can only delete photos that live under their own folder
-- (path is <user_id>/<filename>).
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

drop policy if exists "property_images_select" on storage.objects;
create policy "property_images_select" on storage.objects
  for select
  using (bucket_id = 'property-images');

drop policy if exists "property_images_insert" on storage.objects;
create policy "property_images_insert" on storage.objects
  for insert
  with check (bucket_id = 'property-images' and auth.role() = 'authenticated');

drop policy if exists "property_images_delete" on storage.objects;
create policy "property_images_delete" on storage.objects
  for delete
  using (
    bucket_id = 'property-images'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
