CREATE TYPE public.iso_area AS ENUM ('kvalitet','miljo','arbetsmiljo','gemensamt');
CREATE TYPE public.activity_type AS ENUM ('revision','riskbedomning','ledningens_genomgang','utbildning','skyddsrond','lagbevakning','maluppfoljning','nodlagesovning','leverantorsutvardering','avvikelsehantering','medarbetarsamtal','inventering','policy');
CREATE TYPE public.activity_status AS ENUM ('ej_paborjad','pagaende','klar');
CREATE TYPE public.deviation_type AS ENUM ('avvikelse','tillbud','olycksfall','forbattringsforslag','kundklagomal');
CREATE TYPE public.deviation_status AS ENUM ('ny','under_utredning','atgard_pagar','stangd');
CREATE TYPE public.task_status AS ENUM ('open','in_progress','done');

CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  quarter int NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  title text NOT NULL,
  description text,
  area public.iso_area NOT NULL DEFAULT 'gemensamt',
  activity_type public.activity_type NOT NULL,
  responsible_role text NOT NULL DEFAULT 'KMA-ansvarig',
  assigned_to uuid,
  due_date date NOT NULL,
  status public.activity_status NOT NULL DEFAULT 'ej_paborjad',
  completed_at timestamptz,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  iso_clauses text[] NOT NULL DEFAULT '{}',
  recurring boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inloggade kan hantera aktiviteter" ON public.activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  title text NOT NULL,
  responsible_role text,
  assigned_to uuid,
  due_date date,
  status public.task_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inloggade kan hantera uppgifter" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE SEQUENCE public.deviation_seq START 1;
CREATE TABLE public.deviations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL DEFAULT ('AVV-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.deviation_seq')::text, 3, '0')),
  type public.deviation_type NOT NULL DEFAULT 'avvikelse',
  area public.iso_area NOT NULL DEFAULT 'gemensamt',
  activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  location text,
  severity text NOT NULL DEFAULT 'medium',
  root_cause text,
  corrective_action text,
  responsible_role text,
  reported_by uuid,
  reported_at timestamptz NOT NULL DEFAULT now(),
  due_date date,
  status public.deviation_status NOT NULL DEFAULT 'ny',
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deviations TO authenticated;
GRANT ALL ON public.deviations TO service_role;
GRANT USAGE ON SEQUENCE public.deviation_seq TO authenticated, service_role;
ALTER TABLE public.deviations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inloggade kan hantera avvikelser" ON public.deviations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL,
  area public.iso_area NOT NULL DEFAULT 'gemensamt',
  title text NOT NULL,
  unit text,
  baseline numeric,
  target numeric,
  current_value numeric,
  responsible_role text,
  progress jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.objectives TO authenticated;
GRANT ALL ON public.objectives TO service_role;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inloggade kan hantera mal" ON public.objectives FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER deviations_updated_at BEFORE UPDATE ON public.deviations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER objectives_updated_at BEFORE UPDATE ON public.objectives FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.activities (year, month, quarter, title, description, area, activity_type, responsible_role, due_date, status, checklist, iso_clauses) VALUES
(2026, 1, 1, 'Lagbevakning & regelefterlevnadskontroll', 'Genomgang av gallande lagkrav inom kvalitet, miljo och arbetsmiljo samt bedomning av efterlevnad.', 'gemensamt', 'lagbevakning', 'KMA-ansvarig', '2026-01-30', 'klar', '["Lagforteckning uppdaterad","Nya krav bedomda","Atgarder planerade"]', '{"9001:4.2","14001:6.1.3","45001:6.1.3"}'),
(2026, 2, 1, 'Miljoinventering', 'Inventering av miljoaspekter, kemikalier, avfall och energianvandning.', 'miljo', 'inventering', 'KMA-ansvarig', '2026-02-27', 'klar', '["Miljoaspekter listade","Betydande aspekter bedomda","Kemikalieforteckning uppdaterad"]', '{"14001:6.1.2"}'),
(2026, 2, 1, 'Medarbetarsamtal', 'Arliga utvecklings- och arbetsmiljosamtal med samtliga medarbetare.', 'arbetsmiljo', 'medarbetarsamtal', 'Platschef', '2026-02-27', 'pagaende', '["Samtal bokade","Samtal genomforda","Utvecklingsplaner dokumenterade"]', '{"9001:7.2","45001:7.2"}'),
(2026, 3, 1, 'Oversyn av KMA-policy', 'Arlig genomgang och eventuell revidering av kvalitets-, miljo- och arbetsmiljopolicy.', 'gemensamt', 'policy', 'VD', '2026-03-31', 'klar', '["Policy granskad","Beslut om revidering","Kommunicerad till organisationen"]', '{"9001:5.2","14001:5.2","45001:5.2"}'),
(2026, 4, 2, 'Skyddsrond (Var/Sommar)', 'Skyddsrond med skyddsombud pa samtliga arbetsplatser inkl. atgardslista.', 'arbetsmiljo', 'skyddsrond', 'Skyddsombud', '2026-04-30', 'klar', '["Rond genomford","Protokoll upprattat","Atgarder tilldelade"]', '{"45001:8.1"}'),
(2026, 5, 2, 'Internrevision (Kvalitet & Miljo)', 'Internrevision av ledningssystemet mot ISO 9001 och ISO 14001.', 'kvalitet', 'revision', 'KMA-ansvarig', '2026-05-29', 'pagaende', '["Revisionsplan faststalld","Revision genomford","Rapport distribuerad","Avvikelser registrerade"]', '{"9001:9.2","14001:9.2"}'),
(2026, 6, 2, 'Leverantorsutvardering', 'Utvardering av kritiska leverantorer och underentreprenorer.', 'kvalitet', 'leverantorsutvardering', 'Inkopsansvarig', '2026-06-30', 'ej_paborjad', '["Leverantorslista uppdaterad","Utvardering genomford","Beslut om godkannande"]', '{"9001:8.4"}'),
(2026, 6, 2, 'Uppfoljning av delmal Q1-Q2', 'Halvarsuppfoljning av KMA-mal och nyckeltal.', 'gemensamt', 'maluppfoljning', 'KMA-ansvarig', '2026-06-30', 'ej_paborjad', '["Data insamlad","Avvikelser mot mal analyserade","Rapport till ledningen"]', '{"9001:6.2","14001:6.2","45001:6.2"}'),
(2026, 8, 3, 'Nodlagesovning', 'Praktisk ovning av nodlagesberedskap: brand, utrymning och miljoolycka.', 'gemensamt', 'nodlagesovning', 'KMA-ansvarig', '2026-08-31', 'ej_paborjad', '["Scenario planerat","Ovning genomford","Utvardering dokumenterad"]', '{"14001:8.2","45001:8.2"}'),
(2026, 9, 3, 'Internrevision (Arbetsmiljo)', 'Internrevision mot ISO 45001 inkl. systematiskt arbetsmiljoarbete.', 'arbetsmiljo', 'revision', 'KMA-ansvarig', '2026-09-30', 'ej_paborjad', '["Revisionsplan faststalld","Revision genomford","Rapport distribuerad"]', '{"45001:9.2"}'),
(2026, 9, 3, 'Risk- och konsekvensanalys', 'Riskbedomning av verksamhetens processer, forandringar och arbetsmoment.', 'gemensamt', 'riskbedomning', 'KMA-ansvarig', '2026-09-30', 'ej_paborjad', '["Risker identifierade","Sannolikhet och konsekvens bedomda","Atgardsplan faststalld"]', '{"9001:6.1","14001:6.1","45001:6.1.2"}'),
(2026, 10, 4, 'Arlig arbetsmiljokartlaggning (SAM)', 'Kartlaggning enligt AFS om systematiskt arbetsmiljoarbete inkl. psykosocial arbetsmiljo.', 'arbetsmiljo', 'riskbedomning', 'Skyddsombud', '2026-10-30', 'ej_paborjad', '["Enkat genomford","Resultat analyserat","Handlingsplan upprattad"]', '{"45001:5.4","45001:6.1"}'),
(2026, 11, 4, 'Utbildningsplan & kompetensgenomgang', 'Genomgang av kompetenskrav och planering av utbildningar for kommande ar.', 'gemensamt', 'utbildning', 'Platschef', '2026-11-30', 'ej_paborjad', '["Kompetensmatris uppdaterad","Behov identifierade","Utbildningsplan faststalld"]', '{"9001:7.2","45001:7.2"}'),
(2026, 12, 4, 'Ledningens genomgang (Management Review)', 'Arlig genomgang av ledningssystemets lampighet, tillrackligthet och verkan.', 'gemensamt', 'ledningens_genomgang', 'VD', '2026-12-15', 'ej_paborjad', '["Underlag sammanstallt","Mote genomfort","Protokoll och beslut dokumenterade"]', '{"9001:9.3","14001:9.3","45001:9.3"}'),
(2026, 12, 4, 'Satta nya KMA-mal for kommande ar', 'Faststallande av nya kvalitets-, miljo- och arbetsmiljomal med handlingsplaner.', 'gemensamt', 'maluppfoljning', 'VD', '2026-12-20', 'ej_paborjad', '["Mal formulerade","Nyckeltal definierade","Ansvar och resurser tilldelade"]', '{"9001:6.2","14001:6.2","45001:6.2"}');

INSERT INTO public.activities (year, month, quarter, title, description, area, activity_type, responsible_role, due_date, status, checklist, iso_clauses)
SELECT 2026, m, ((m - 1) / 3) + 1,
  'Manadsgenomgang avvikelser & tillbud',
  'Genomgang av registrerade avvikelser, tillbud och forbattringsforslag samt status pa atgarder.',
  'gemensamt', 'avvikelsehantering', 'KMA-ansvarig',
  (make_date(2026, m, 1) + interval '1 month - 1 day')::date,
  CASE WHEN m < 8 THEN 'klar'::public.activity_status ELSE 'ej_paborjad'::public.activity_status END,
  '["Nya avvikelser genomgangna","Atgarder foljda upp","Stangda avvikelser verifierade"]'::jsonb,
  '{"9001:10.2","14001:10.2","45001:10.2"}'
FROM generate_series(1,12) AS m;

INSERT INTO public.activities (year, month, quarter, title, description, area, activity_type, responsible_role, due_date, status, checklist, iso_clauses)
SELECT 2026, m, ((m - 1) / 3) + 1,
  'Manadsuppfoljning arbetsplats & skyddsrunda',
  'Kort skyddsrunda och uppfoljning av arbetsmiljo pa aktuella arbetsplatser.',
  'arbetsmiljo', 'skyddsrond', 'Platschef',
  (make_date(2026, m, 15))::date,
  CASE WHEN m < 8 THEN 'klar'::public.activity_status ELSE 'ej_paborjad'::public.activity_status END,
  '["Rundvandring genomford","Brister dokumenterade","Atgarder rapporterade"]'::jsonb,
  '{"45001:8.1"}'
FROM generate_series(1,12) AS m;

INSERT INTO public.objectives (year, area, title, unit, baseline, target, current_value, responsible_role) VALUES
(2026, 'miljo', 'Minska CO2-utslapp per omsatt krona med 10%', 'kg CO2e/tkr', 120, 108, 114, 'KMA-ansvarig'),
(2026, 'arbetsmiljo', 'Noll olycksfall med franvaro', 'antal', 2, 0, 1, 'Skyddsombud'),
(2026, 'kvalitet', 'Minska kundklagomal med 25%', 'antal/ar', 16, 12, 9, 'VD');