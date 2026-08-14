import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type OrgRole = "owner" | "admin" | "member";

export type Organization = {
  id: string;
  name: string;
  org_number: string | null;
  domain: string | null;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  created_at: string;
};

export type OrgMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
  email: string | null;
  full_name: string | null;
};

export type OrgInvitation = {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  status: string;
  expires_at: string;
  created_at: string;
};

export type MyOrg = { organization: Organization; role: OrgRole } | null;

export const myOrgQuery = () =>
  queryOptions({
    queryKey: ["my-organization"],
    queryFn: async (): Promise<MyOrg> => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      // Se till att den inloggade användaren har en profil.
      await supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email ?? null }, { onConflict: "id" });

      const { data, error } = await supabase
        .from("organization_members")
        .select("role, organizations(*)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data || !data.organizations) return null;
      return {
        role: data.role as OrgRole,
        organization: data.organizations as unknown as Organization,
      };
    },
  });

export const orgMembersQuery = (orgId: string | undefined) =>
  queryOptions({
    queryKey: ["org-members", orgId],
    enabled: Boolean(orgId),
    queryFn: async (): Promise<OrgMember[]> => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = data ?? [];
      const ids = rows.map((r) => r.user_id);
      const profiles = ids.length
        ? (await supabase.from("profiles").select("id, email, full_name").in("id", ids)).data ?? []
        : [];
      return rows.map((r) => {
        const p = profiles.find((x) => x.id === r.user_id);
        return {
          ...(r as unknown as Omit<OrgMember, "email" | "full_name">),
          email: p?.email ?? null,
          full_name: p?.full_name ?? null,
        };
      });
    },
  });

export const orgInvitationsQuery = (orgId: string | undefined) =>
  queryOptions({
    queryKey: ["org-invitations", orgId],
    enabled: Boolean(orgId),
    queryFn: async (): Promise<OrgInvitation[]> => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("organization_invitations")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrgInvitation[];
    },
  });

export const ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Ägare",
  admin: "Administratör",
  member: "Medlem",
};
