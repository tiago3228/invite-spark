-- Meu Convite | WhatsApp obrigatório no RSVP público.
-- Cole este arquivo no editor SQL do Lovable e execute.

DROP FUNCTION IF EXISTS public.submit_guest_response(uuid, text, text, integer);

CREATE OR REPLACE FUNCTION public.submit_guest_response(
  _invitation_id uuid,
  _name text,
  _whatsapp text,
  _status text,
  _companions integer DEFAULT 0
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _status NOT IN ('confirmed', 'declined') THEN
    RETURN false;
  END IF;

  IF nullif(trim(_name), '') IS NULL OR length(regexp_replace(coalesce(_whatsapp, ''), '[^0-9]', '', 'g')) < 10 THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.invitations
    WHERE id = _invitation_id AND status = 'published'
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.guests (invitation_id, name, whatsapp, status, companions, responded_at)
  VALUES (
    _invitation_id,
    left(trim(_name), 160),
    left(regexp_replace(_whatsapp, '[^0-9]', '', 'g'), 20),
    _status,
    CASE WHEN _status = 'confirmed' THEN greatest(0, least(coalesce(_companions, 0), 20)) ELSE 0 END,
    now()
  );

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_guest_response(uuid, text, text, text, integer) TO anon, authenticated;
