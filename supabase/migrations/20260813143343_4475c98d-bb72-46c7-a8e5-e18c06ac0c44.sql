-- Roles
CREATE TYPE public.org_role AS ENUM ('owner','admin','member');

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Organizations
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  org_number text,
  domain text UNIQUE,
  address text,
  contact_email text,
  contact_phone text,
  logo_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.org_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.org_role NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_invitations TO authenticated;
GRANT ALL ON public.organization_invitations TO service_role;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Helper functions (security definer, avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_org_member(_org uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = _org AND m.user_id = _user);
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_org uuid, _user uuid, _roles public.org_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = _org AND m.user_id = _user AND m.role = ANY(_roles)
  );
$$;

-- Policies
CREATE POLICY "Egen profil lasbar" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.organization_members m1
    JOIN public.organization_members m2 ON m1.organization_id = m2.organization_id
    WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id
  ));
CREATE POLICY "Egen profil skapas" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Egen profil uppdateras" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Medlemmar ser bolaget" ON public.organizations FOR SELECT TO authenticated
  USING (public.is_org_member(id, auth.uid()));
CREATE POLICY "Skapa bolag" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admin uppdaterar bolag" ON public.organizations FOR UPDATE TO authenticated
  USING (public.has_org_role(id, auth.uid(), ARRAY['owner','admin']::public.org_role[]))
  WITH CHECK (public.has_org_role(id, auth.uid(), ARRAY['owner','admin']::public.org_role[]));
CREATE POLICY "Agare raderar bolag" ON public.organizations FOR DELETE TO authenticated
  USING (public.has_org_role(id, auth.uid(), ARRAY['owner']::public.org_role[]));

CREATE POLICY "Medlemmar ser medlemslista" ON public.organization_members FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "Admin lagger till medlem" ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]));
CREATE POLICY "Admin uppdaterar medlem" ON public.organization_members FOR UPDATE TO authenticated
  USING (public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]))
  WITH CHECK (public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]));
CREATE POLICY "Admin tar bort medlem" ON public.organization_members FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]) OR user_id = auth.uid());

CREATE POLICY "Se inbjudningar" ON public.organization_invitations FOR SELECT TO authenticated
  USING (public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[])
         OR lower(email) = lower(coalesce(auth.jwt() ->> 'email','')));
CREATE POLICY "Admin skapar inbjudan" ON public.organization_invitations FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]));
CREATE POLICY "Admin uppdaterar inbjudan" ON public.organization_invitations FOR UPDATE TO authenticated
  USING (public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]))
  WITH CHECK (public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]));
CREATE POLICY "Admin raderar inbjudan" ON public.organization_invitations FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]));

-- updated_at triggers
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER organization_members_updated_at BEFORE UPDATE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER organization_invitations_updated_at BEFORE UPDATE ON public.organization_invitations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Creator becomes owner
CREATE OR REPLACE FUNCTION public.add_creator_as_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, COALESCE(NEW.created_by, auth.uid()), 'owner')
  ON CONFLICT (organization_id, user_id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER organizations_add_owner AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.add_creator_as_owner();

-- Profile + invitation/domain auto-join on signup and email confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user_org()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_domain text;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NULLIF(NEW.raw_user_meta_data ->> 'full_name',''))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  IF NEW.email_confirmed_at IS NOT NULL THEN
    -- accept pending invitations for this verified email
    INSERT INTO public.organization_members (organization_id, user_id, role)
    SELECT i.organization_id, NEW.id, i.role
    FROM public.organization_invitations i
    WHERE lower(i.email) = lower(NEW.email)
      AND i.status = 'pending'
      AND i.expires_at > now()
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    UPDATE public.organization_invitations
      SET status = 'accepted', accepted_at = now()
      WHERE lower(email) = lower(NEW.email) AND status = 'pending' AND expires_at > now();

    -- auto-join by verified email domain
    v_domain := lower(split_part(NEW.email, '@', 2));
    IF v_domain <> '' THEN
      INSERT INTO public.organization_members (organization_id, user_id, role)
      SELECT o.id, NEW.id, 'member' FROM public.organizations o
      WHERE lower(o.domain) = v_domain
      ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created_org
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_org();

CREATE TRIGGER on_auth_user_confirmed_org
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.handle_new_user_org();