import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/kma/AppShell";
import { ObjectiveDialog } from "@/components/kma/ObjectiveDialog";
import { Button } from "@/components/ui/button";
import { AREA_SHORT, AREA_VAR, type Objective } from "@/lib/kma";
import { objectivesQuery, CURRENT_YEAR } from "@/lib/kma-queries";


export const Route = createFileRoute("/_authenticated/mal")({
  head: () => ({
    meta: [
      { title: "KMA-mål – Ledningssystem" },
      {
        name: "description",
        content:
          "Kvalitets-, miljö- och arbetsmiljömål med utgångsvärde, målvärde och aktuell uppföljning.",
      },
      { property: "og:title", content: "KMA-mål – Ledningssystem" },
      {
        property: "og:description",
        content: "Måluppföljning för ISO 9001, 14001 och 45001.",
      },
    ],
  }),
  component: ObjectivesPage,
});

function progressPct(o: Objective): number {
  if (o.baseline === null || o.target === null || o.current_value === null) return 0;
  const span = o.baseline - o.target;
  if (span === 0) return o.current_value <= o.target ? 100 : 0;
  const pct = ((o.baseline - o.current_value) / span) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function ObjectivesPage() {
  const { data: objectives = [] } = useQuery(objectivesQuery());
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <AppShell
      title={`KMA-mål ${CURRENT_YEAR}`}
      subtitle="Måluppföljning som underlag till ledningens genomgång"
      actions={
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" /> Nytt mål
        </Button>
      }
    >
      <ObjectiveDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

        {objectives.map((o) => {
          const pct = progressPct(o);
          return (
            <article key={o.id} className="rounded-xl border border-border bg-card p-5 shadow-panel">
              <span
                className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: AREA_VAR[o.area] }}
              >
                {AREA_SHORT[o.area]}
              </span>
              <h2 className="mt-3 text-base font-semibold text-foreground">{o.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Ansvarig: {o.responsible_role ?? "—"}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Utgång</p>
                  <p className="font-semibold text-foreground">{o.baseline ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nu</p>
                  <p className="font-semibold text-foreground">{o.current_value ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mål</p>
                  <p className="font-semibold text-foreground">{o.target ?? "—"}</p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: AREA_VAR[o.area] }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {pct}% av målet uppnått{o.unit ? ` · enhet: ${o.unit}` : ""}
              </p>
            </article>
          );
        })}
        {objectives.length === 0 ? (
          <p className="text-sm text-muted-foreground">Inga mål registrerade för året.</p>
        ) : null}
      </div>
    </AppShell>
  );
}
