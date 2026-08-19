DROP POLICY IF EXISTS "Bolagets forslag" ON public.ai_suggestions;
CREATE POLICY "Bolagets forslag" ON public.ai_suggestions FOR ALL TO authenticated
USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
WITH CHECK (organization_id IS NULL OR public.is_org_member(organization_id, auth.uid()));

DROP POLICY IF EXISTS "Bolagets aktiviteter" ON public.activities;
CREATE POLICY "Bolagets aktiviteter" ON public.activities FOR ALL TO authenticated
USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
WITH CHECK (organization_id IS NULL OR public.is_org_member(organization_id, auth.uid()));

DROP POLICY IF EXISTS "Bolagets mal" ON public.objectives;
CREATE POLICY "Bolagets mal" ON public.objectives FOR ALL TO authenticated
USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
WITH CHECK (organization_id IS NULL OR public.is_org_member(organization_id, auth.uid()));

DROP POLICY IF EXISTS "Bolagets avvikelser" ON public.deviations;
CREATE POLICY "Bolagets avvikelser" ON public.deviations FOR ALL TO authenticated
USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
WITH CHECK (organization_id IS NULL OR public.is_org_member(organization_id, auth.uid()));