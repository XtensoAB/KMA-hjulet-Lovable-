CREATE TABLE public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_path text not null,
  mime_type text not null,
  size_bytes integer not null default 0,
  area iso_area not null default 'gemensamt',
  uploaded_by uuid,
  analysis_status text not null default 'ny',
  analysis_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inloggade kan hantera dokument" ON public.documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  kind text not null default 'activity',
  area iso_area not null default 'gemensamt',
  title text not null,
  description text,
  rationale text,
  iso_clauses text[] not null default '{}',
  month integer,
  activity_type activity_type,
  responsible_role text,
  checklist jsonb not null default '[]',
  unit text,
  baseline numeric,
  target numeric,
  status text not null default 'foreslagen',
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_suggestions TO authenticated;
GRANT ALL ON public.ai_suggestions TO service_role;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inloggade kan hantera forslag" ON public.ai_suggestions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Inloggade kan lasa dokument" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ledningssystem-dokument');
CREATE POLICY "Inloggade kan ladda upp dokument" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ledningssystem-dokument');
CREATE POLICY "Inloggade kan uppdatera dokument" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ledningssystem-dokument');
CREATE POLICY "Inloggade kan radera dokument" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ledningssystem-dokument');