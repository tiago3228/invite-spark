-- Meu Convite | RSVP público integrado à lista de convidados
-- Registra respostas sem expor a tabela guests para escrita anônima.

create or replace function public.submit_guest_response(
  _invitation_id uuid,
  _name text,
  _status text,
  _companions integer default 0
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if _status not in ('confirmed', 'declined') then
    return false;
  end if;

  if nullif(trim(_name), '') is null then
    return false;
  end if;

  if not exists (
    select 1 from public.invitations
    where id = _invitation_id and status = 'published'
  ) then
    return false;
  end if;

  insert into public.guests (invitation_id, name, status, companions, responded_at)
  values (
    _invitation_id,
    left(trim(_name), 160),
    _status,
    case when _status = 'confirmed' then greatest(0, least(coalesce(_companions, 0), 20)) else 0 end,
    now()
  );

  return true;
end;
$$;

grant execute on function public.submit_guest_response(uuid, text, text, integer) to anon, authenticated;
