-- Meu Convite | Pagamento único de temas premium via Mercado Pago

alter table public.themes add column if not exists is_premium boolean not null default false;
alter table public.themes add column if not exists product_key text;

update public.themes set is_premium = true, product_key = 'premium_theme_pack' where name in ('Essência', 'Celebre');
update public.themes set product_key = 'free' where product_key is null;

create table if not exists public.theme_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_key text not null default 'premium_theme_pack',
  provider text not null default 'mercadopago',
  preference_id text unique,
  payment_id text unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),
  amount numeric(12,2) not null,
  currency text not null default 'BRL',
  raw_data jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists theme_purchases_user_idx on public.theme_purchases(user_id);
create index if not exists theme_purchases_status_idx on public.theme_purchases(status);

grant select on public.theme_purchases to authenticated;
grant all on public.theme_purchases to service_role;

alter table public.theme_purchases enable row level security;
drop policy if exists "Users can view own theme purchases" on public.theme_purchases;
create policy "Users can view own theme purchases" on public.theme_purchases for select to authenticated using (auth.uid() = user_id);

drop trigger if exists theme_purchases_set_updated_at on public.theme_purchases;
create trigger theme_purchases_set_updated_at before update on public.theme_purchases for each row execute procedure public.set_updated_at();
