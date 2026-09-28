-- Meu Convite | Acesso premium integral do administrador master
-- O e-mail é usado somente dentro de funções SECURITY DEFINER no banco.

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('tiago3228@yahoo.com.br')
on conflict (user_id, role) do nothing;

create or replace function public.is_master_admin(_user_id uuid)
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
      and role = 'admin'::public.app_role
  )
  or exists (
    select 1
    from auth.users
    where id = _user_id
      and lower(email) = lower('tiago3228@yahoo.com.br')
  )
$$;

grant execute on function public.is_master_admin(uuid) to authenticated;
