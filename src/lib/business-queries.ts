import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type {
  BusinessActivity,
  BusinessGoal,
  BusinessGoalItem,
  CommunicationLog,
  Stakeholder,
} from "@/lib/business";
import { CURRENT_YEAR } from "@/lib/kma-queries";

export const businessGoalsQuery = (year: number = CURRENT_YEAR) =>
  queryOptions({
    queryKey: ["business_goals", year],
    queryFn: async (): Promise<BusinessGoal[]> => {
      const { data, error } = await supabase
        .from("business_goals")
        .select("*")
        .eq("year", year)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as BusinessGoal[];
    },
  });

export const businessGoalItemsQuery = () =>
  queryOptions({
    queryKey: ["business_goal_items"],
    queryFn: async (): Promise<BusinessGoalItem[]> => {
      const { data, error } = await supabase
        .from("business_goal_items")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as BusinessGoalItem[];
    },
  });

export const businessActivitiesQuery = (year: number = CURRENT_YEAR) =>
  queryOptions({
    queryKey: ["business_activities", year],
    queryFn: async (): Promise<BusinessActivity[]> => {
      const { data, error } = await supabase
        .from("business_activities")
        .select("*")
        .eq("year", year)
        .order("month", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as BusinessActivity[];
    },
  });

export const stakeholdersQuery = () =>
  queryOptions({
    queryKey: ["stakeholders"],
    queryFn: async (): Promise<Stakeholder[]> => {
      const { data, error } = await supabase
        .from("stakeholders")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Stakeholder[];
    },
  });

export const communicationLogsQuery = () =>
  queryOptions({
    queryKey: ["communication_logs"],
    queryFn: async (): Promise<CommunicationLog[]> => {
      const { data, error } = await supabase
        .from("communication_logs")
        .select("*")
        .order("planned_date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as CommunicationLog[];
    },
  });
