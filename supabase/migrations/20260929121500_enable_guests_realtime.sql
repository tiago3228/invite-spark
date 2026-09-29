-- Meu Convite | Atualização em tempo real do painel de convidados

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'guests'
  ) then
    alter publication supabase_realtime add table public.guests;
  end if;
end
$$;
