-- Meu Convite | Limite de pessoas por convite familiar.
-- Cole este arquivo no editor SQL do Lovable e execute.

ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS party_limit integer NOT NULL DEFAULT 1;

ALTER TABLE public.guests
  DROP CONSTRAINT IF EXISTS guests_party_limit_check;

ALTER TABLE public.guests
  ADD CONSTRAINT guests_party_limit_check CHECK (party_limit BETWEEN 1 AND 20);

CREATE TABLE IF NOT EXISTS public.guest_party_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  name text NOT NULL,
  whatsapp text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guest_party_members_guest_idx
  ON public.guest_party_members(guest_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_party_members TO authenticated;
GRANT ALL ON public.guest_party_members TO service_role;
ALTER TABLE public.guest_party_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage guest party members" ON public.guest_party_members;
CREATE POLICY "Owners manage guest party members" ON public.guest_party_members
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.guests g
    JOIN public.invitations i ON i.id = g.invitation_id
    WHERE g.id = guest_party_members.guest_id
      AND i.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.guests g
    JOIN public.invitations i ON i.id = g.invitation_id
    WHERE g.id = guest_party_members.guest_id
      AND i.user_id = auth.uid()
  ));

DROP FUNCTION IF EXISTS public.get_guest_by_token(text);
CREATE FUNCTION public.get_guest_by_token(_token text)
RETURNS TABLE(
  id uuid,
  name text,
  whatsapp text,
  status text,
  companions integer,
  party_limit integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.id, g.name, g.whatsapp, g.status, g.companions, g.party_limit
  FROM public.guests g
  JOIN public.invitations i ON i.id = g.invitation_id
  WHERE g.token = _token AND i.status = 'published'
$$;

DROP FUNCTION IF EXISTS public.respond_guest(text, text, integer);
CREATE FUNCTION public.respond_guest(
  _token text,
  _status text,
  _companions integer,
  _member_names text[] DEFAULT NULL,
  _whatsapp text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target public.guests;
  cleaned_names text[];
  member_count integer;
BEGIN
  IF _status NOT IN ('confirmed', 'declined') THEN
    RETURN false;
  END IF;

  SELECT g.* INTO target
  FROM public.guests g
  JOIN public.invitations i ON i.id = g.invitation_id
  WHERE g.token = _token AND i.status = 'published'
  FOR UPDATE;

  IF target.id IS NULL THEN
    RETURN false;
  END IF;

  cleaned_names := ARRAY(
    SELECT left(trim(value), 160)
    FROM unnest(coalesce(_member_names, ARRAY[]::text[])) AS value
    WHERE nullif(trim(value), '') IS NOT NULL
    LIMIT target.party_limit
  );
  member_count := coalesce(array_length(cleaned_names, 1), 0);

  IF _status = 'confirmed' AND member_count = 0 THEN
    RETURN false;
  END IF;

  DELETE FROM public.guest_party_members WHERE guest_id = target.id;

  IF _status = 'confirmed' THEN
    INSERT INTO public.guest_party_members (guest_id, name, whatsapp)
    SELECT target.id, value, CASE WHEN ordinality = 1 THEN left(regexp_replace(coalesce(_whatsapp, target.whatsapp), '[^0-9]', '', 'g'), 20) ELSE '' END
    FROM unnest(cleaned_names) WITH ORDINALITY AS item(value, ordinality);
  END IF;

  UPDATE public.guests
  SET status = _status,
      whatsapp = CASE WHEN nullif(regexp_replace(coalesce(_whatsapp, ''), '[^0-9]', '', 'g'), '') IS NULL THEN whatsapp ELSE left(regexp_replace(_whatsapp, '[^0-9]', '', 'g'), 20) END,
      companions = CASE WHEN _status = 'confirmed' THEN greatest(0, member_count - 1) ELSE 0 END,
      responded_at = now()
  WHERE id = target.id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_guest_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_guest(text, text, integer, text[], text) TO anon, authenticated;
