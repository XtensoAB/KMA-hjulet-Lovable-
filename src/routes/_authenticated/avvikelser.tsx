import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/kma/AppShell";
import { DeviationDialog } from "@/components/kma/DeviationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  AREA_SHORT,
  AREA_VAR,
  DEVIATION_STATUS_LABEL,
  DEVIATION_TYPE_LABEL,
  formatDate,
  type DeviationStatus,
} from "@/lib/kma";
import { deviationsQuery } from "@/lib/kma-queries";

export const Route = createFileRoute("/_authenticated/avvikelser")({
  head: () => ({
    meta: [
      { title: "Avvikelser & tillbud – KMA Ledningssystem" },
      {
        name: "description",
        content:
          "Registrera och följ upp avvikelser, tillbud, olycksfall och förbättringsförslag med korrigerande åtgärder.",
      },
      { property: "og:title", content: "Avvikelser & tillbud – KMA Ledningssystem" },
      {
        property: "og:description",
        content: "Kanban för avvikelsehantering enligt ISO 9001, 14001 och 45001.",
      },
    ],
  }),
  component: DeviationsPage,
});

const COLUMNS: DeviationStatus[] = ["ny", "under_utredning", "atgard_pagar", "stangd"];

function DeviationsPage() {
  const queryClient = useQueryClient();
  const { data: deviations = [] } = useQuery(deviationsQuery());
  const [open, setOpen] = useState(false);

  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DeviationStatus }) => {
      const { error } = await supabase
        .from("deviations")
        .update({
          status,
          closed_at: status === "stangd" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deviations"] });
      toast.success("Status uppdaterad");
    },
    onError: () => toast.error("Kunde inte uppdatera status"),
  });

  return (
    <AppShell
      title="Avvikelser & tillbud"
      subtitle={`${deviations.filter((d) => d.status !== "stangd").length} öppna av ${deviations.length} totalt`}
      actions={
        <Button size="sm" onClick={() => setOpen(true)}>
          Ny registrering
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-4">
        {COLUMNS.map((status) => {
          const items = deviations.filter((d) => d.status === status);
          return (
            <section key={status} className="rounded-xl border border-border bg-secondary/50 p-3">
              <div className="flex items-center justify-between px-1 pb-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {DEVIATION_STATUS_LABEL[status]}
                </h2>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.map((d) => {
                  const nextIndex = COLUMNS.indexOf(d.status) + 1;
                  const next = COLUMNS[nextIndex];
                  return (
                    <article
                      key={d.id}
                      className="rounded-lg border border-border bg-card p-3 shadow-panel"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {d.reference}
                        </span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                          style={{ backgroundColor: AREA_VAR[d.area] }}
                        >
                          {AREA_SHORT[d.area]}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-foreground">{d.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {DEVIATION_TYPE_LABEL[d.type]} · {d.responsible_role ?? "Ej tilldelad"}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          Åtgärd: {formatDate(d.due_date)}
                        </Badge>
                        {next ? (
                          <button
                            className="text-xs text-primary hover:underline"
                            onClick={() => move.mutate({ id: d.id, status: next })}
                          >
                            Flytta →
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
                {items.length === 0 ? (
                  <p className="px-1 py-3 text-xs text-muted-foreground">Inga poster.</p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      <DeviationDialog activity={null} open={open} onClose={() => setOpen(false)} />
    </AppShell>
  );
}
