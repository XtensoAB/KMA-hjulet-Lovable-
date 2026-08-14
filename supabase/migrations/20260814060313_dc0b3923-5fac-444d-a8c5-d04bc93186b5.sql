-- Helper: the calling user's organization (first membership)
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.organization_id FROM public.organization_members m
  WHERE m.user_id = auth.uid()
  ORDER BY m.created_at ASC
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.current_org_id() FROM public;

-- Add organization scoping columns
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.deviations ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.objectives ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.ai_suggestions ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Backfill existing rows when there is exactly one organization
DO $$
DECLARE v_org uuid;
BEGIN
  SELECT id INTO v_org FROM public.organizations ORDER BY created_at ASC LIMIT 1;
  IF v_org IS NOT NULL AND (SELECT count(*) FROM public.organizations) = 1 THEN
    UPDATE public.activities SET organization_id = v_org WHERE organization_id IS NULL;
    UPDATE public.deviations SET organization_id = v_org WHERE organization_id IS NULL;
    UPDATE public.objectives SET organization_id = v_org WHERE organization_id IS NULL;
    UPDATE public.documents SET organization_id = v_org WHERE organization_id IS NULL;
    UPDATE public.ai_suggestions SET organization_id = v_org WHERE organization_id IS NULL;
    UPDATE public.tasks SET organization_id = v_org WHERE organization_id IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS activities_org_idx ON public.activities(organization_id);
CREATE INDEX IF NOT EXISTS deviations_org_idx ON public.deviations(organization_id);
CREATE INDEX IF NOT EXISTS objectives_org_idx ON public.objectives(organization_id);
CREATE INDEX IF NOT EXISTS documents_org_idx ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS ai_suggestions_org_idx ON public.ai_suggestions(organization_id);
CREATE INDEX IF NOT EXISTS tasks_org_idx ON public.tasks(organization_id);

-- Default organization on insert, and prevent moving rows between orgs
CREATE OR REPLACE FUNCTION public.set_row_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NULL THEN
      NEW.organization_id := public.current_org_id();
    END IF;
  ELSE
    NEW.organization_id := OLD.organization_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.set_task_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT a.organization_id INTO NEW.organization_id
  FROM public.activities a WHERE a.id = NEW.activity_id;
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := public.current_org_id();
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS activities_set_org ON public.activities;
CREATE TRIGGER activities_set_org BEFORE INSERT OR UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.set_row_organization();
DROP TRIGGER IF EXISTS deviations_set_org ON public.deviations;
CREATE TRIGGER deviations_set_org BEFORE INSERT OR UPDATE ON public.deviations FOR EACH ROW EXECUTE FUNCTION public.set_row_organization();
DROP TRIGGER IF EXISTS objectives_set_org ON public.objectives;
CREATE TRIGGER objectives_set_org BEFORE INSERT OR UPDATE ON public.objectives FOR EACH ROW EXECUTE FUNCTION public.set_row_organization();
DROP TRIGGER IF EXISTS documents_set_org ON public.documents;
CREATE TRIGGER documents_set_org BEFORE INSERT OR UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_row_organization();
DROP TRIGGER IF EXISTS ai_suggestions_set_org ON public.ai_suggestions;
CREATE TRIGGER ai_suggestions_set_org BEFORE INSERT OR UPDATE ON public.ai_suggestions FOR EACH ROW EXECUTE FUNCTION public.set_row_organization();
DROP TRIGGER IF EXISTS tasks_set_org ON public.tasks;
CREATE TRIGGER tasks_set_org BEFORE INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_task_organization();

-- Replace permissive policies with organization-scoped ones
DROP POLICY IF EXISTS "Inloggade kan hantera aktiviteter" ON public.activities;
CREATE POLICY "Bolagets aktiviteter" ON public.activities FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(COALESCE(organization_id, public.current_org_id()), auth.uid()));

DROP POLICY IF EXISTS "Inloggade kan hantera avvikelser" ON public.deviations;
CREATE POLICY "Bolagets avvikelser" ON public.deviations FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(COALESCE(organization_id, public.current_org_id()), auth.uid()));

DROP POLICY IF EXISTS "Inloggade kan hantera mal" ON public.objectives;
CREATE POLICY "Bolagets mal" ON public.objectives FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(COALESCE(organization_id, public.current_org_id()), auth.uid()));

DROP POLICY IF EXISTS "Inloggade kan hantera dokument" ON public.documents;
CREATE POLICY "Bolagets dokument" ON public.documents FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(COALESCE(organization_id, public.current_org_id()), auth.uid()));

DROP POLICY IF EXISTS "Inloggade kan hantera forslag" ON public.ai_suggestions;
CREATE POLICY "Bolagets forslag" ON public.ai_suggestions FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(COALESCE(organization_id, public.current_org_id()), auth.uid()));

DROP POLICY IF EXISTS "Inloggade kan hantera uppgifter" ON public.tasks;
CREATE POLICY "Bolagets uppgifter" ON public.tasks FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = tasks.activity_id AND public.is_org_member(a.organization_id, auth.uid())
  ));

-- Storage: scope object access to the owning organization
DROP POLICY IF EXISTS "Inloggade kan lasa dokument" ON storage.objects;
DROP POLICY IF EXISTS "Inloggade kan ladda upp dokument" ON storage.objects;
DROP POLICY IF EXISTS "Inloggade kan uppdatera dokument" ON storage.objects;
DROP POLICY IF EXISTS "Inloggade kan radera dokument" ON storage.objects;

CREATE POLICY "Bolagsmedlemmar laser dokumentfiler" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'ledningssystem-dokument'
  AND (
    owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.file_path = storage.objects.name
        AND public.is_org_member(d.organization_id, auth.uid())
    )
  )
);

CREATE POLICY "Bolagsmedlemmar laddar upp dokumentfiler" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ledningssystem-dokument'
  AND owner = auth.uid()
  AND public.current_org_id() IS NOT NULL
);

CREATE POLICY "Uppladdare uppdaterar dokumentfiler" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'ledningssystem-dokument'
  AND (
    owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.file_path = storage.objects.name
        AND public.has_org_role(d.organization_id, auth.uid(), ARRAY['owner','admin']::org_role[])
    )
  )
)
WITH CHECK (bucket_id = 'ledningssystem-dokument' AND owner = auth.uid());

CREATE POLICY "Uppladdare raderar dokumentfiler" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'ledningssystem-dokument'
  AND (
    owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.file_path = storage.objects.name
        AND public.has_org_role(d.organization_id, auth.uid(), ARRAY['owner','admin']::org_role[])
    )
  )
);