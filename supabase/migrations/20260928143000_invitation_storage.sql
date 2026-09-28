-- Meu Convite | Supabase Storage para fotos e arquivos
-- O caminho dos arquivos começa pelo auth.uid(), isolando upload e remoção por usuário.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invitation-media',
  'invitation-media',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/ogg', 'audio/wav']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- A leitura pública é intencional: somente URLs de mídia já inseridas no convite publicado são exibidas.
drop policy if exists "Public can view invitation media" on storage.objects;
create policy "Public can view invitation media"
on storage.objects for select
using (bucket_id = 'invitation-media');

drop policy if exists "Users upload own invitation media" on storage.objects;
create policy "Users upload own invitation media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'invitation-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own invitation media" on storage.objects;
create policy "Users update own invitation media"
on storage.objects for update to authenticated
using (
  bucket_id = 'invitation-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'invitation-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own invitation media" on storage.objects;
create policy "Users delete own invitation media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'invitation-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);
