DROP POLICY IF EXISTS "Bolagets dokument" ON public.documents;

CREATE POLICY "Bolagets dokument"
ON public.documents
FOR ALL
TO authenticated
USING (
  organization_id IS NOT NULL
  AND public.is_org_member(organization_id, auth.uid())
)
WITH CHECK (
  organization_id IS NOT NULL
  AND public.is_org_member(organization_id, auth.uid())
);

REVOKE EXECUTE ON FUNCTION public.current_org_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_org_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_org_id() FROM authenticated;