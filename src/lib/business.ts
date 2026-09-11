import type { ActivityStatus } from "@/lib/kma";

export type BusinessCategory = "personal" | "foretag" | "styrelse" | "externt";
export type GoalItemKind = "delmal" | "aktivitet";
export type Importance = "viktig" | "mindre_viktig";
export type Effort = "latt" | "svar";
export type CommStatus = "planerad" | "genomford" | "installd";

export type BusinessGoal = {
  id: string;
  year: number;
  title: string;
  description: string | null;
  responsible_role: string | null;
  unit: string | null;
  baseline: number | null;
  target: number | null;
  current_value: number | null;
  status: ActivityStatus;
};

export type BusinessGoalItem = {
  id: string;
  goal_id: string;
  kind: GoalItemKind;
  title: string;
  description: string | null;
  importance: Importance;
  effort: Effort;
  responsible_role: string | null;
  due_date: string | null;
  status: ActivityStatus;
};

export type BusinessActivity = {
  id: string;
  year: number;
  month: number;
  category: BusinessCategory;
  title: string;
  description: string | null;
  responsible_role: string | null;
  due_date: string | null;
  status: ActivityStatus;
  recurring: boolean;
};

export type Stakeholder = {
  id: string;
  name: string;
  interaction_need: string | null;
  how_to_communicate: string | null;
  what_to_communicate: string | null;
  sort_order: number;
};

export type CommunicationLog = {
  id: string;
  stakeholder_id: string | null;
  title: string;
  channel: string | null;
  message: string | null;
  planned_date: string | null;
  performed_at: string | null;
  status: CommStatus;
  responsible_role: string | null;
};

export const CATEGORY_ORDER: BusinessCategory[] = [
  "personal",
  "foretag",
  "styrelse",
  "externt",
];

export const CATEGORY_LABEL: Record<BusinessCategory, string> = {
  personal: "Personal",
  foretag: "Företag",
  styrelse: "Styrelse",
  externt: "Externt",
};

export const CATEGORY_COLOR: Record<BusinessCategory, string> = {
  personal: "var(--kvalitet)",
  foretag: "var(--gemensamt)",
  styrelse: "var(--arbetsmiljo)",
  externt: "var(--miljo)",
};

export const KIND_LABEL: Record<GoalItemKind, string> = {
  delmal: "Delmål",
  aktivitet: "Aktivitet",
};

export const IMPORTANCE_LABEL: Record<Importance, string> = {
  viktig: "Viktig",
  mindre_viktig: "Mindre viktig",
};

export const EFFORT_LABEL: Record<Effort, string> = {
  latt: "Lätt att genomföra",
  svar: "Svår att genomföra",
};

export const COMM_STATUS_LABEL: Record<CommStatus, string> = {
  planerad: "Planerad",
  genomford: "Genomförd",
  installd: "Inställd",
};

export const CHANNELS = [
  "LinkedIn",
  "Nyhetsbrev",
  "Kundmöte",
  "Frukostseminarium",
  "Intern kanal",
  "Månadsmöte",
  "Event/nätverksträff",
  "Personligt samtal",
  "Pressmeddelande",
];

export const DEFAULT_STAKEHOLDERS: Omit<Stakeholder, "id">[] = [
  {
    name: "Befintliga kunder",
    interaction_need: "Förtroende, utveckling, merförsäljning",
    how_to_communicate:
      "Kvartalsvisa avstämningar, kundmöten, gemensamma retros, riktade LinkedIn-inlägg",
    what_to_communicate:
      "Nya kompetenser, lyckade uppdrag, proaktiva förbättringsförslag, nya avtal, nya konsulter",
    sort_order: 1,
  },
  {
    name: "Potentiella kunder",
    interaction_need: "Kännedom, trovärdighet, referenser",
    how_to_communicate: "LinkedIn, nätverksträffar, frukostseminarier, riktade möten",
    what_to_communicate:
      "Referensuppdrag, kundcase, \u201Dså här löste vi…\u201D, tillgänglig kompetens, ramavtal",
    sort_order: 2,
  },
  {
    name: "Partners",
    interaction_need: "Gemensam affär, pipeline, tydligare samarbete",
    how_to_communicate:
      "Partneravstämning 1 gång/månad eller kvartal, gemensamma kundcase, gemensamma LinkedIn-inlägg",
    what_to_communicate:
      "Nya möjligheter, vunna affärer, gemensamma leveranser, kompetensområden, kontaktvägar",
    sort_order: 3,
  },
  {
    name: "Anställda",
    interaction_need: "Delaktighet, stolthet, utveckling",
    how_to_communicate:
      "Månadsmöte, intern kanal, lunch & learn, korta nyhetsuppdateringar",
    what_to_communicate:
      "Nya kunder, nya uppdrag, rekryteringar, feedback från kunder, utvecklingsmöjligheter",
    sort_order: 4,
  },
  {
    name: "Kandidater",
    interaction_need: "Attraktiv arbetsgivare, kultur, utveckling",
    how_to_communicate: "LinkedIn, personliga kontakter, kandidatpool, event",
    what_to_communicate:
      "Nyanställda, roliga uppdrag, utvecklingsmöjligheter, kultur, villkor, vardagen hos er",
    sort_order: 5,
  },
  {
    name: "Högskolor",
    interaction_need: "Praktik, exjobb, rekrytering",
    how_to_communicate:
      "Gästföreläsningar, praktikannonser, LinkedIn riktat till studenter, karriärdagar",
    what_to_communicate:
      "Praktikplatser, exjobb, verkliga case, utvecklingsvägar, anställningsmöjligheter",
    sort_order: 6,
  },
  {
    name: "Kollegor/nätverk",
    interaction_need: "Sammanhållning, erfarenhetsutbyte",
    how_to_communicate:
      "Informella träffar, erfarenhetsforum, interna/externa nätverksträffar",
    what_to_communicate:
      "Lärdomar från uppdrag, kundinsikter, nya kontakter, gemensamma möjligheter",
    sort_order: 7,
  },
];

export const CONTENT_BANK = [
  "Vi har vunnit nytt avtal",
  "Vi har startat nytt uppdrag",
  "Vi har levererat tillsammans med kund/partner",
  "Vi har anställt ny person",
  "Vi söker kompetens inom X",
  "Vi erbjuder praktik/exjobb",
  "Vi delar lärdom från uppdrag",
  "Vi lyfter kundnytta/resultat",
  "Vi visar kultur: team, vardag, utveckling",
];
