import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Activity, Deviation, Objective } from "@/lib/kma";

export const CURRENT_YEAR = 2026;

export const activitiesQuery = (year: number = CURRENT_YEAR) =>
  queryOptions({
    queryKey: ["activities", year],
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("year", year)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Activity[];
    },
  });

export const deviationsQuery = () =>
  queryOptions({
    queryKey: ["deviations"],
    queryFn: async (): Promise<Deviation[]> => {
      const { data, error } = await supabase
        .from("deviations")
        .select("*")
        .order("reported_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Deviation[];
    },
  });

export const objectivesQuery = (year: number = CURRENT_YEAR) =>
  queryOptions({
    queryKey: ["objectives", year],
    queryFn: async (): Promise<Objective[]> => {
      const { data, error } = await supabase
        .from("objectives")
        .select("*")
        .eq("year", year)
        .order("area", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Objective[];
    },
  });

export type DocumentRow = {
  id: string;
  title: string;
  file_path: string;
  mime_type: string;
  size_bytes: number;
  area: string;
  analysis_status: string;
  analysis_summary: string | null;
  created_at: string;
};

export type SuggestionRow = {
  id: string;
  document_id: string | null;
  kind: string;
  area: string;
  title: string;
  description: string | null;
  rationale: string | null;
  iso_clauses: string[];
  month: number | null;
  activity_type: string | null;
  responsible_role: string | null;
  checklist: unknown;
  unit: string | null;
  baseline: number | null;
  target: number | null;
  status: string;
  created_at: string;
};

export const documentsQuery = () =>
  queryOptions({
    queryKey: ["documents"],
    queryFn: async (): Promise<DocumentRow[]> => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DocumentRow[];
    },
  });

export const suggestionsQuery = () =>
  queryOptions({
    queryKey: ["ai_suggestions"],
    queryFn: async (): Promise<SuggestionRow[]> => {
      const { data, error } = await supabase
        .from("ai_suggestions")
        .select("*")
        .eq("status", "foreslagen")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SuggestionRow[];
    },
  });
