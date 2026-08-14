import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/kma/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  myOrgQuery,
  orgInvitationsQuery,
  orgMembersQuery,
  ROLE_LABELS,
  type OrgRole,
} from "@/lib/org-queries";

export const Route = createFileRoute("/_authenticated/bolag")({
  head: () => ({
    meta: [
      { title: "Bolagsprofil & användare – KMA Ledningssystem" },
      {
        name: "description",
        content:
          "Hantera bolagsprofil, e-postdomän, roller och bjud in kollegor till det integrerade ledningssystemet.",
      },
      { property: "og:title", content: "Bolagsprofil & användare – KMA Ledningssystem" },
      {
        property: "og:description",
        content: "Bolagsuppgifter, domänanslutning och inbjudningar för ISO 9001, 14001 och 45001.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyPage,
  errorComponent: () => (
    <AppShell title="Bolagsprofil">
      <p className="text-sm text-muted-foreground">Kunde inte läsa bolagsuppgifter.</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell title="Bolagsprofil">
      <p className="text-sm text-muted-foreground">Sidan hittades inte.</p>
    </AppShell>
  ),
});

function CompanyPage() {
  const qc = useQueryClient();
  const { data: myOrg, isLoading } = useQuery(myOrgQuery());
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? "");
      setUserId(data.user?.id ?? "");
    });
  }, []);

  if (isLoading) {
    return (
      <AppShell title="Bolagsprofil">
        <p className="text-sm text-muted-foreground">Laddar…</p>
      </AppShell>
    );
  }

  if (!myOrg) {
    return (
      <AppShell
        title="Bolagsprofil"
        subtitle="Skapa er bolagsprofil för att komma igång med ledningssystemet."
      >
        <CreateOrgForm
          defaultDomain={userEmail.split("@")[1] ?? ""}
          userId={userId}
          onCreated={() => qc.invalidateQueries({ queryKey: ["my-organization"] })}
        />
      </AppShell>
    );
  }

  const canManage = myOrg.role === "owner" || myOrg.role === "admin";

  return (
    <AppShell
      title={myOrg.organization.name}
      subtitle={`Bolagsprofil och användare · din roll: ${ROLE_LABELS[myOrg.role]}`}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <OrgProfileCard org={myOrg.organization} canManage={canManage} />
        <div className="space-y-6">
          <InviteCard orgId={myOrg.organization.id} canManage={canManage} />
          <MembersCard orgId={myOrg.organization.id} canManage={canManage} meId={userId} />
        </div>
      </div>
    </AppShell>
  );
}

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-panel">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CreateOrgForm({
  defaultDomain,
  userId,
  onCreated,
}: {
  defaultDomain: string;
  userId: string;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    org_number: "",
    domain: defaultDomain,
    address: "",
    contact_email: "",
    contact_phone: "",
  });

  useEffect(() => {
    setForm((f) => (f.domain ? f : { ...f, domain: defaultDomain }));
  }, [defaultDomain]);

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("organizations").insert({
        name: form.name,
        org_number: form.org_number || null,
        domain: form.domain ? form.domain.trim().toLowerCase() : null,
        address: form.address || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        created_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bolagsprofilen är skapad. Du är nu ägare.");
      onCreated();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kunde inte skapa bolaget"),
  });

  return (
    <Panel
      title="Ny bolagsprofil"
      description="Kollegor med bekräftad e-post på er domän ansluts automatiskt till bolaget."
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Field label="Bolagsnamn" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Organisationsnummer" value={form.org_number} onChange={(v) => setForm({ ...form, org_number: v })} />
        <Field label="E-postdomän" placeholder="foretaget.se" value={form.domain} onChange={(v) => setForm({ ...form, domain: v })} />
        <Field label="Kontakt e-post" type="email" value={form.contact_email} onChange={(v) => setForm({ ...form, contact_email: v })} />
        <Field label="Telefon" value={form.contact_phone} onChange={(v) => setForm({ ...form, contact_phone: v })} />
        <Field label="Adress" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={create.isPending || !form.name}>
            Skapa bolagsprofil
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function OrgProfileCard({
  org,
  canManage,
}: {
  org: {
    id: string;
    name: string;
    org_number: string | null;
    domain: string | null;
    address: string | null;
    contact_email: string | null;
    contact_phone: string | null;
  };
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: org.name,
    org_number: org.org_number ?? "",
    domain: org.domain ?? "",
    address: org.address ?? "",
    contact_email: org.contact_email ?? "",
    contact_phone: org.contact_phone ?? "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: form.name,
          org_number: form.org_number || null,
          domain: form.domain ? form.domain.trim().toLowerCase() : null,
          address: form.address || null,
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
        })
        .eq("id", org.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bolagsprofilen är sparad");
      qc.invalidateQueries({ queryKey: ["my-organization"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kunde inte spara"),
  });

  return (
    <Panel
      title="Bolagsuppgifter"
      description="Används i rapporter och styr vilka som ansluts automatiskt via e-postdomän."
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Field label="Bolagsnamn" required disabled={!canManage} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Organisationsnummer" disabled={!canManage} value={form.org_number} onChange={(v) => setForm({ ...form, org_number: v })} />
        <Field label="E-postdomän" placeholder="foretaget.se" disabled={!canManage} value={form.domain} onChange={(v) => setForm({ ...form, domain: v })} />
        <Field label="Kontakt e-post" type="email" disabled={!canManage} value={form.contact_email} onChange={(v) => setForm({ ...form, contact_email: v })} />
        <Field label="Telefon" disabled={!canManage} value={form.contact_phone} onChange={(v) => setForm({ ...form, contact_phone: v })} />
        <Field label="Adress" disabled={!canManage} value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        {canManage ? (
          <div className="sm:col-span-2">
            <Button type="submit" disabled={save.isPending}>
              Spara ändringar
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground sm:col-span-2">
            Endast ägare och administratörer kan ändra bolagsuppgifterna.
          </p>
        )}
      </form>
    </Panel>
  );
}

function InviteCard({ orgId, canManage }: { orgId: string; canManage: boolean }) {
  const qc = useQueryClient();
  const { data: invitations = [] } = useQuery(orgInvitationsQuery(orgId));
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("member");

  const invite = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("organization_invitations").upsert(
        {
          organization_id: orgId,
          email: email.trim().toLowerCase(),
          role,
          status: "pending",
          invited_by: userData.user?.id ?? null,
        },
        { onConflict: "organization_id,email" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inbjudan registrerad. Personen ansluts när kontot skapas.");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["org-invitations", orgId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kunde inte bjuda in"),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organization_invitations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-invitations", orgId] }),
  });

  return (
    <Panel
      title="Bjud in användare"
      description="Inbjudna skapar konto på inloggningssidan och kopplas automatiskt till bolaget."
    >
      {canManage ? (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            invite.mutate();
          }}
        >
          <div className="min-w-56 flex-1 space-y-2">
            <Label htmlFor="invite-email">E-postadress</Label>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kollega@foretaget.se"
            />
          </div>
          <div className="space-y-2">
            <Label>Roll</Label>
            <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Medlem</SelectItem>
                <SelectItem value="admin">Administratör</SelectItem>
                <SelectItem value="owner">Ägare</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={invite.isPending}>
            Skicka inbjudan
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Endast ägare och administratörer kan bjuda in användare.
        </p>
      )}

      <ul className="mt-5 divide-y divide-border">
        {invitations.length === 0 ? (
          <li className="py-2 text-sm text-muted-foreground">Inga inbjudningar ännu.</li>
        ) : null}
        {invitations.map((inv) => (
          <li key={inv.id} className="flex items-center justify-between gap-3 py-2">
            <div>
              <p className="text-sm text-foreground">{inv.email}</p>
              <p className="text-xs text-muted-foreground">
                {ROLE_LABELS[inv.role]} · giltig t.o.m.{" "}
                {new Date(inv.expires_at).toLocaleDateString("sv-SE")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={inv.status === "accepted" ? "default" : "secondary"}>
                {inv.status === "accepted" ? "Ansluten" : "Väntar"}
              </Badge>
              {canManage && inv.status !== "accepted" ? (
                <Button variant="ghost" size="sm" onClick={() => revoke.mutate(inv.id)}>
                  Återkalla
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function MembersCard({
  orgId,
  canManage,
  meId,
}: {
  orgId: string;
  canManage: boolean;
  meId: string;
}) {
  const qc = useQueryClient();
  const { data: members = [] } = useQuery(orgMembersQuery(orgId));

  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: OrgRole }) => {
      const { error } = await supabase.from("organization_members").update({ role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rollen är uppdaterad");
      qc.invalidateQueries({ queryKey: ["org-members", orgId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kunde inte uppdatera rollen"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organization_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-members", orgId] }),
  });

  return (
    <Panel title="Användare" description={`${members.length} personer i bolaget.`}>
      <ul className="divide-y divide-border">
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm text-foreground">
                {m.full_name || m.email || "Användare"}
                {m.user_id === meId ? " (du)" : ""}
              </p>
              <p className="text-xs text-muted-foreground">{m.email ?? "—"}</p>
            </div>
            <div className="flex items-center gap-2">
              {canManage ? (
                <Select
                  value={m.role}
                  onValueChange={(v) => changeRole.mutate({ id: m.id, role: v as OrgRole })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Medlem</SelectItem>
                    <SelectItem value="admin">Administratör</SelectItem>
                    <SelectItem value="owner">Ägare</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary">{ROLE_LABELS[m.role]}</Badge>
              )}
              {canManage && m.user_id !== meId ? (
                <Button variant="ghost" size="sm" onClick={() => remove.mutate(m.id)}>
                  Ta bort
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const id = `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
