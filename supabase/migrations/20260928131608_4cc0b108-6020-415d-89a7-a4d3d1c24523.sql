create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  whatsapp text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create type public.app_role as enum ('admin', 'customer');

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  description text,
  preview_image text,
  configuration jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  custom_event_type text,
  title text,
  slug text unique,
  status text not null default 'draft' check (status in ('draft', 'preview', 'awaiting_payment', 'payment_pending', 'paid', 'published', 'unpublished', 'cancelled')),
  theme_id uuid references public.themes(id) on delete set null,
  event_date date,
  event_time time,
  event_end_time time,
  content jsonb not null default '{}'::jsonb,
  location jsonb not null default '{}'::jsonb,
  rsvp_config jsonb not null default '{"mode":"native"}'::jsonb,
  pix_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz
);

create index if not exists invitations_user_id_idx on public.invitations(user_id);
create index if not exists invitations_status_idx on public.invitations(status);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
grant select on public.themes to anon;
grant select on public.themes to authenticated;
grant all on public.themes to service_role;
grant select, insert, update, delete on public.invitations to authenticated;
grant all on public.invitations to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, whatsapp)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Novo cliente'),
    coalesce(nullif(new.raw_user_meta_data ->> 'whatsapp', ''), '')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    whatsapp = excluded.whatsapp,
    updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists invitations_set_updated_at on public.invitations;
create trigger invitations_set_updated_at before update on public.invitations for each row execute procedure public.set_updated_at();

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.themes enable row level security;
alter table public.invitations enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can view own roles" on public.user_roles;
create policy "Users can view own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Anyone can view active themes" on public.themes;
create policy "Anyone can view active themes" on public.themes for select using (active = true);

drop policy if exists "Users can view own invitations" on public.invitations;
create policy "Users can view own invitations" on public.invitations for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can create own invitations" on public.invitations;
create policy "Users can create own invitations" on public.invitations for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update own invitations" on public.invitations;
create policy "Users can update own invitations" on public.invitations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own draft invitations" on public.invitations;
create policy "Users can delete own draft invitations" on public.invitations for delete to authenticated using (auth.uid() = user_id and status = 'draft');

insert into public.themes (name, category, description, configuration)
values
  ('Jardim', 'Floral', 'Floral delicado', '{"palette":["#d8e7d7","#2f5145"],"motion":"soft"}'),
  ('Essência', 'Minimalista', 'Minimalista e elegante', '{"palette":["#eee9e0","#4e4a43"],"motion":"none"}'),
  ('Celebre', 'Festa', 'Festa vibrante', '{"palette":["#e7b29c","#6d3e31"],"motion":"playful"}')
on conflict (name) do nothing;