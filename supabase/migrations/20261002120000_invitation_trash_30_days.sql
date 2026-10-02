-- Meu Convite | Lixeira de convites com restauração por 30 dias
-- Cole este arquivo no editor SQL do Lovable e execute.
-- A exclusão da interface passa a ser lógica: o convite fica em lixeira,
-- deixa de ser público e só é apagado definitivamente após 30 dias.

ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS status_before_trash text;

-- O status trashed é interno e não fica acessível pela rota pública.
ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_status_check;

ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_status_check CHECK (
    status IN (
      'draft',
      'preview',
      'awaiting_payment',
      'payment_pending',
      'paid',
      'published',
      'unpublished',
      'cancelled',
      'trashed'
    )
  );

CREATE INDEX IF NOT EXISTS invitations_trash_expiry_idx
  ON public.invitations (user_id, deleted_at)
  WHERE status = 'trashed' AND deleted_at IS NOT NULL;

-- Revoga o delete físico usado pelo fluxo antigo. A remoção definitiva
-- acontece somente pela função de limpeza após 30 dias.
DROP POLICY IF EXISTS "Users can delete own draft invitations" ON public.invitations;

-- Reforça que nenhum convite na lixeira pode ser visto publicamente.
DROP POLICY IF EXISTS "Public can view published invitations" ON public.invitations;
CREATE POLICY "Public can view published invitations"
  ON public.invitations
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND deleted_at IS NULL);

CREATE OR REPLACE FUNCTION public.move_invitation_to_trash(_invitation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invitations
     SET status_before_trash = COALESCE(status_before_trash, status),
         status = 'trashed',
         deleted_at = timezone('utc', now())
   WHERE id = _invitation_id
     AND user_id = auth.uid()
     AND status <> 'trashed';

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_invitation_from_trash(_invitation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invitations
     SET status = COALESCE(NULLIF(status_before_trash, ''), 'draft'),
         status_before_trash = NULL,
         deleted_at = NULL
   WHERE id = _invitation_id
     AND user_id = auth.uid()
     AND status = 'trashed'
     AND deleted_at > timezone('utc', now()) - interval '30 days';

  RETURN FOUND;
END;
$$;

-- A aplicação chama esta função ao abrir o painel. Assim a limpeza é segura
-- mesmo em projetos onde o pg_cron não está habilitado.
CREATE OR REPLACE FUNCTION public.purge_expired_own_invitations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed_count integer;
BEGIN
  DELETE FROM public.invitations
   WHERE user_id = auth.uid()
     AND status = 'trashed'
     AND deleted_at IS NOT NULL
     AND deleted_at <= timezone('utc', now()) - interval '30 days';

  GET DIAGNOSTICS removed_count = ROW_COUNT;
  RETURN removed_count;
END;
$$;

REVOKE ALL ON FUNCTION public.move_invitation_to_trash(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_invitation_from_trash(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_expired_own_invitations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_invitation_to_trash(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_invitation_from_trash(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_own_invitations() TO authenticated;

-- Verificação opcional após a execução:
-- SELECT id, title, status, deleted_at, status_before_trash
-- FROM public.invitations
-- WHERE user_id = auth.uid()
-- ORDER BY updated_at DESC;
