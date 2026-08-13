export type Area = "kvalitet" | "miljo" | "arbetsmiljo" | "gemensamt";
export type ActivityStatus = "ej_paborjad" | "pagaende" | "klar";
export type EffectiveStatus = ActivityStatus | "forsenad";
export type DeviationType =
  | "avvikelse"
  | "tillbud"
  | "olycksfall"
  | "forbattringsforslag"
  | "kundklagomal";
export type DeviationStatus = "ny" | "under_utredning" | "atgard_pagar" | "stangd";

export type ChecklistItem = string | { text: string; done?: boolean };

export type Activity = {
  id: string;
  year: number;
  month: number;
  quarter: number;
  title: string;
  description: string | null;
  area: Area;
  activity_type: string;
  responsible_role: string;
  due_date: string;
  status: ActivityStatus;
  completed_at: string | null;
  checklist: ChecklistItem[];
  iso_clauses: string[];
  recurring: boolean;
};

export type Deviation = {
  id: string;
  reference: string;
  type: DeviationType;
  area: Area;
  activity_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  severity: string;
  root_cause: string | null;
  corrective_action: string | null;
  responsible_role: string | null;
  reported_at: string;
  due_date: string | null;
  status: DeviationStatus;
  closed_at: string | null;
};

export type Objective = {
  id: string;
  year: number;
  area: Area;
  title: string;
  unit: string | null;
  baseline: number | null;
  target: number | null;
  current_value: number | null;
  responsible_role: string | null;
};

export const AREA_ORDER: Area[] = ["kvalitet", "miljo", "arbetsmiljo", "gemensamt"];

export const AREA_LABEL: Record<Area, string> = {
  kvalitet: "Kvalitet (9001)",
  miljo: "Miljö (14001)",
  arbetsmiljo: "Arbetsmiljö (45001)",
  gemensamt: "Gemensamt",
};

export const AREA_SHORT: Record<Area, string> = {
  kvalitet: "Kvalitet",
  miljo: "Miljö",
  arbetsmiljo: "Arbetsmiljö",
  gemensamt: "Gemensamt",
};

export const AREA_VAR: Record<Area, string> = {
  kvalitet: "var(--kvalitet)",
  miljo: "var(--miljo)",
  arbetsmiljo: "var(--arbetsmiljo)",
  gemensamt: "var(--gemensamt)",
};

export const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  revision: "Revision",
  riskbedomning: "Riskbedömning",
  ledningens_genomgang: "Ledningens genomgång",
  utbildning: "Utbildning",
  skyddsrond: "Skyddsrond",
  lagbevakning: "Lagbevakning",
  maluppfoljning: "Mål-uppföljning",
  nodlagesovning: "Nödlägesövning",
  leverantorsutvardering: "Leverantörsutvärdering",
  avvikelsehantering: "Avvikelsehantering",
  medarbetarsamtal: "Medarbetarsamtal",
  inventering: "Inventering",
  policy: "Policy",
};

export const STATUS_LABEL: Record<EffectiveStatus, string> = {
  ej_paborjad: "Ej påbörjad",
  pagaende: "Pågående",
  klar: "Klar",
  forsenad: "Försenad",
};

export const DEVIATION_TYPE_LABEL: Record<DeviationType, string> = {
  avvikelse: "Avvikelse",
  tillbud: "Tillbud",
  olycksfall: "Olycksfall",
  forbattringsforslag: "Förbättringsförslag",
  kundklagomal: "Kundklagomål",
};

export const DEVIATION_STATUS_LABEL: Record<DeviationStatus, string> = {
  ny: "Ny",
  under_utredning: "Under utredning",
  atgard_pagar: "Åtgärd pågår",
  stangd: "Stängd",
};

export const ROLES = [
  "VD",
  "KMA-ansvarig",
  "Skyddsombud",
  "Platschef",
  "Inköpsansvarig",
  "Medarbetare",
];

export const MONTHS = [
  "Januari",
  "Februari",
  "Mars",
  "April",
  "Maj",
  "Juni",
  "Juli",
  "Augusti",
  "September",
  "Oktober",
  "November",
  "December",
];

export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Maj",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
];

export function effectiveStatus(activity: Activity): EffectiveStatus {
  if (activity.status === "klar") return "klar";
  const due = new Date(activity.due_date + "T23:59:59");
  if (due.getTime() < Date.now()) return "forsenad";
  return activity.status;
}

export function checklistText(item: ChecklistItem): string {
  return typeof item === "string" ? item : item.text;
}

export function checklistDone(item: ChecklistItem): boolean {
  return typeof item === "string" ? false : Boolean(item.done);
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function daysUntil(value: string): number {
  const due = new Date(value + "T00:00:00").getTime();
  return Math.ceil((due - Date.now()) / 86_400_000);
}
