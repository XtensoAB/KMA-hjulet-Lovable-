CREATE OR REPLACE FUNCTION public.claim_organization_access()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
  v_domain text;
  v_org uuid;
BEGIN
  IF v_user IS NULL THEN RETURN NULL; END IF;

  SELECT lower(u.email), u.email_confirmed_at INTO v_email, v_confirmed
  FROM auth.users u WHERE u.id = v_user;

  IF v_email IS NULL OR v_confirmed IS NULL THEN RETURN NULL; END IF;

  INSERT INTO public.profiles (id, email)
  VALUES (v_user, v_email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  SELECT i.organization_id, v_user, i.role
  FROM public.organization_invitations i
  WHERE lower(i.email) = v_email AND i.status = 'pending' AND i.expires_at > now()
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  UPDATE public.organization_invitations
    SET status = 'accepted', accepted_at = now()
    WHERE lower(email) = v_email AND status = 'pending' AND expires_at > now();

  v_domain := regexp_replace(split_part(v_email, '@', 2), '^www\.', '');
  IF v_domain <> '' THEN
    INSERT INTO public.organization_members (organization_id, user_id, role)
    SELECT o.id, v_user, 'member' FROM public.organizations o
    WHERE regexp_replace(lower(coalesce(o.domain,'')), '^www\.', '') = v_domain
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;

  SELECT m.organization_id INTO v_org FROM public.organization_members m
  WHERE m.user_id = v_user ORDER BY m.created_at ASC LIMIT 1;
  RETURN v_org;
END; $$;

REVOKE ALL ON FUNCTION public.claim_organization_access() FROM public;
GRANT EXECUTE ON FUNCTION public.claim_organization_access() TO authenticated;

-- Backfill: koppla redan registrerade användare med väntande inbjudan
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT i.organization_id, u.id, i.role
FROM public.organization_invitations i
JOIN auth.users u ON lower(u.email) = lower(i.email) AND u.email_confirmed_at IS NOT NULL
WHERE i.status = 'pending' AND i.expires_at > now()
ON CONFLICT (organization_id, user_id) DO NOTHING;

UPDATE public.organization_invitations i
SET status = 'accepted', accepted_at = now()
FROM auth.users u
WHERE lower(u.email) = lower(i.email) AND u.email_confirmed_at IS NOT NULL
  AND i.status = 'pending' AND i.expires_at > now();

INSERT INTO public.profiles (id, email)
SELECT u.id, u.email FROM auth.users u
WHERE u.email_confirmed_at IS NOT NULL
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;