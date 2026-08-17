DROP POLICY IF EXISTS "Bolagsmedlemmar laddar upp dokumentfiler" ON storage.objects;
CREATE POLICY "Bolagsmedlemmar laddar upp dokumentfiler"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ledningssystem-dokument'
  AND owner = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.organization_members m WHERE m.user_id = auth.uid()
  )
);