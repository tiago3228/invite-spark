-- Meu Convite | Acesso público a convites publicados
-- Concede apenas leitura anônima e somente para registros publicados.

grant select on public.invitations to anon;

drop policy if exists "Public can view published invitations" on public.invitations;
create policy "Public can view published invitations"
on public.invitations
for select
to anon, authenticated
using (status = 'published');
