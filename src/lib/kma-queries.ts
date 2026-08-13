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
