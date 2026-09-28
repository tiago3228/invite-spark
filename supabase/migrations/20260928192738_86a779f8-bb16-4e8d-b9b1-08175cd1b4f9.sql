CREATE TABLE public.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  name text NOT NULL,
  whatsapp text NOT NULL DEFAULT '',
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-',''),
  status text NOT NULL DEFAULT 'pending',
  companions integer NOT NULL DEFAULT 0,
  responded_at timestamptz,
  reminded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guests TO authenticated;
GRANT ALL ON public.guests TO service_role;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage guests" ON public.guests FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.invitations i WHERE i.id = guests.invitation_id AND i.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.invitations i WHERE i.id = guests.invitation_id AND i.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.get_guest_by_token(_token text)
RETURNS TABLE(name text, status text, companions integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.name, g.status, g.companions FROM public.guests g
  JOIN public.invitations i ON i.id = g.invitation_id
  WHERE g.token = _token AND i.status = 'published'
$$;

CREATE OR REPLACE FUNCTION public.respond_guest(_token text, _status text, _companions integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _status NOT IN ('confirmed','declined') THEN RETURN false; END IF;
  UPDATE public.guests g SET status = _status, companions = GREATEST(0, LEAST(coalesce(_companions,0), 20)), responded_at = now()
  FROM public.invitations i
  WHERE g.token = _token AND i.id = g.invitation_id AND i.status = 'published';
  RETURN FOUND;
END $$;
GRANT EXECUTE ON FUNCTION public.get_guest_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_guest(text, text, integer) TO anon, authenticated;