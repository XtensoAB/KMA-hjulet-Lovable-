CREATE TYPE public.business_category AS ENUM ('personal','foretag','styrelse','externt');
CREATE TYPE public.goal_item_kind AS ENUM ('delmal','aktivitet');
CREATE TYPE public.priority_importance AS ENUM ('viktig','mindre_viktig');
CREATE TYPE public.priority_effort AS ENUM ('latt','svar');
CREATE TYPE public.comm_status AS ENUM ('planerad','genomford','installd');

CREATE TABLE public.business_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  year integer NOT NULL DEFAULT 2026,
  title text NOT NULL,
  description text,
  responsible_role text,
  unit text,
  baseline numeric,
  target numeric,
  current_value numeric,
  status activity_status NOT NULL DEFAULT 'ej_paborjad',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_goals TO authenticated;
GRANT ALL ON public.business_goals TO service_role;
ALTER TABLE public.business_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bolagets bolagsmal" ON public.business_goals FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (organization_id IS NULL OR public.is_org_member(organization_id, auth.uid()));

CREATE TABLE public.business_goal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES public.business_goals(id) ON DELETE CASCADE,
  kind goal_item_kind NOT NULL DEFAULT 'aktivitet',
  title text NOT NULL,
  description text,
  importance priority_importance NOT NULL DEFAULT 'viktig',
  effort priority_effort NOT NULL DEFAULT 'latt',
  responsible_role text,
  due_date date,
  status activity_status NOT NULL DEFAULT 'ej_paborjad',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_goal_items TO authenticated;
GRANT ALL ON public.business_goal_items TO service_role;
ALTER TABLE public.business_goal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bolagets malposter" ON public.business_goal_items FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (organization_id IS NULL OR public.is_org_member(organization_id, auth.uid()));

CREATE TABLE public.business_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  year integer NOT NULL DEFAULT 2026,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  category business_category NOT NULL DEFAULT 'foretag',
  title text NOT NULL,
  description text,
  responsible_role text,
  due_date date,
  status activity_status NOT NULL DEFAULT 'ej_paborjad',
  recurring boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_activities TO authenticated;
GRANT ALL ON public.business_activities TO service_role;
ALTER TABLE public.business_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bolagets bolagsaktiviteter" ON public.business_activities FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (organization_id IS NULL OR public.is_org_member(organization_id, auth.uid()));

CREATE TABLE public.stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  interaction_need text,
  how_to_communicate text,
  what_to_communicate text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stakeholders TO authenticated;
GRANT ALL ON public.stakeholders TO service_role;
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bolagets intressenter" ON public.stakeholders FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (organization_id IS NULL OR public.is_org_member(organization_id, auth.uid()));

CREATE TABLE public.communication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  stakeholder_id uuid REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  title text NOT NULL,
  channel text,
  message text,
  planned_date date,
  performed_at timestamptz,
  status comm_status NOT NULL DEFAULT 'planerad',
  responsible_role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communication_logs TO authenticated;
GRANT ALL ON public.communication_logs TO service_role;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bolagets kommunikation" ON public.communication_logs FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (organization_id IS NULL OR public.is_org_member(organization_id, auth.uid()));

CREATE TRIGGER business_goals_set_org BEFORE INSERT OR UPDATE ON public.business_goals FOR EACH ROW EXECUTE FUNCTION public.set_row_organization();
CREATE TRIGGER business_goal_items_set_org BEFORE INSERT OR UPDATE ON public.business_goal_items FOR EACH ROW EXECUTE FUNCTION public.set_row_organization();
CREATE TRIGGER business_activities_set_org BEFORE INSERT OR UPDATE ON public.business_activities FOR EACH ROW EXECUTE FUNCTION public.set_row_organization();
CREATE TRIGGER stakeholders_set_org BEFORE INSERT OR UPDATE ON public.stakeholders FOR EACH ROW EXECUTE FUNCTION public.set_row_organization();
CREATE TRIGGER communication_logs_set_org BEFORE INSERT OR UPDATE ON public.communication_logs FOR EACH ROW EXECUTE FUNCTION public.set_row_organization();

CREATE TRIGGER business_goals_updated_at BEFORE UPDATE ON public.business_goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER business_goal_items_updated_at BEFORE UPDATE ON public.business_goal_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER business_activities_updated_at BEFORE UPDATE ON public.business_activities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER stakeholders_updated_at BEFORE UPDATE ON public.stakeholders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER communication_logs_updated_at BEFORE UPDATE ON public.communication_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();