-- Meu Convite | Editor, mídia e RSVP
-- Migração incremental: reutiliza profiles, themes e invitations existentes.

create table if not exists public.invitation_sections (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  section_type text not null,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  unique (invitation_id, section_type)
);

create table if not exists public.invitation_media (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  media_type text not null check (media_type in ('cover', 'image', 'video', 'audio')),
  url text not null,
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  guest_name text not null,
  status text not null check (status in ('confirmed', 'declined', 'pending')),
  companions integer not null default 0 check (companions >= 0 and companions <= 20),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists invitation_sections_invitation_idx on public.invitation_sections(invitation_id);
create index if not exists invitation_media_invitation_idx on public.invitation_media(invitation_id);
create index if not exists rsvps_invitation_idx on public.rsvps(invitation_id);

grant select, insert, update, delete on public.invitation_sections to authenticated;
grant select on public.invitation_sections to anon;
grant select, insert, update, delete on public.invitation_media to authenticated;
grant select on public.invitation_media to anon;
grant select, insert on public.rsvps to anon;
grant select, insert, update on public.rsvps to authenticated;

alter table public.invitation_sections enable row level security;
alter table public.invitation_media enable row level security;
alter table public.rsvps enable row level security;

-- O contratante gerencia apenas os dados do próprio convite.
drop policy if exists "Owners manage invitation sections" on public.invitation_sections;
create policy "Owners manage invitation sections" on public.invitation_sections for all to authenticated
using (exists (select 1 from public.invitations i where i.id = invitation_id and i.user_id = auth.uid()))
with check (exists (select 1 from public.invitations i where i.id = invitation_id and i.user_id = auth.uid()));

drop policy if exists "Owners manage invitation media" on public.invitation_media;
create policy "Owners manage invitation media" on public.invitation_media for all to authenticated
using (exists (select 1 from public.invitations i where i.id = invitation_id and i.user_id = auth.uid()))
with check (exists (select 1 from public.invitations i where i.id = invitation_id and i.user_id = auth.uid()));

-- Convidados só podem enviar RSVP para convite publicado; respostas são privadas para leitura.
drop policy if exists "Guests can submit RSVP to published invitations" on public.rsvps;
create policy "Guests can submit RSVP to published invitations" on public.rsvps for insert to anon, authenticated
with check (exists (select 1 from public.invitations i where i.id = invitation_id and i.status = 'published'));
drop policy if exists "Owners can view RSVP" on public.rsvps;
create policy "Owners can view RSVP" on public.rsvps for select to authenticated
using (exists (select 1 from public.invitations i where i.id = invitation_id and i.user_id = auth.uid()));
drop policy if exists "Owners can update RSVP" on public.rsvps;
create policy "Owners can update RSVP" on public.rsvps for update to authenticated
using (exists (select 1 from public.invitations i where i.id = invitation_id and i.user_id = auth.uid()))
with check (exists (select 1 from public.invitations i where i.id = invitation_id and i.user_id = auth.uid()));

-- A página pública retorna apenas convites publicados.
drop policy if exists "Public can view published invitations" on public.invitations;
create policy "Public can view published invitations" on public.invitations for select to anon, authenticated using (status = 'published');
drop policy if exists "Public can view published sections" on public.invitation_sections;
create policy "Public can view published sections" on public.invitation_sections for select to anon, authenticated
using (exists (select 1 from public.invitations i where i.id = invitation_id and i.status = 'published'));
drop policy if exists "Public can view published media" on public.invitation_media;
create policy "Public can view published media" on public.invitation_media for select to anon, authenticated
using (exists (select 1 from public.invitations i where i.id = invitation_id and i.status = 'published'));
