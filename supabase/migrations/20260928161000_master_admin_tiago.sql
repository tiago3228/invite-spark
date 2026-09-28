-- Meu Convite | Administrador master inicial
-- O papel admin existente representa o nível master nesta primeira versão.
-- A regra é aplicada no banco, nunca apenas no frontend.

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('tiago3228@yahoo.com.br')
on conflict (user_id, role) do nothing;

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

  if lower(coalesce(new.email, '')) = lower('tiago3228@yahoo.com.br') then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin'::public.app_role)
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$;

-- Permite que o próprio master seja reconhecido por uma função estável,
-- sem expor auth.users diretamente ao cliente.
create or replace function public.is_master_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(_user_id, 'admin'::public.app_role)
$$;

grant execute on function public.is_master_admin(uuid) to authenticated;
