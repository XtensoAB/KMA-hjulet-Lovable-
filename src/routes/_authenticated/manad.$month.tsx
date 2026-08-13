import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/kma/AppShell";
import { DeviationDialog } from "@/components/kma/DeviationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  ACTIVITY_TYPE_LABEL,
  AREA_SHORT,
  AREA_VAR,
  DEVIATION_STATUS_LABEL,
  MONTHS,
  STATUS_LABEL,
  checklistDone,
  checklistText,
  effectiveStatus,
  formatDate,
  type Activity,
  type ActivityStatus,
} from "@/lib/kma";
import { activitiesQuery, deviationsQuery, CURRENT_YEAR } from "@/lib/kma-queries";

export const Route = createFileRoute("/_authenticated/manad/$month")({
  head: () => ({
    meta: [
      { title: "Månadsagenda – KMA Ledningssystem" },
      {
        name: "description",
        content:
          "Operativ månadsagenda med aktiviteter, checklistor, ansvar och kopplade avvikelser.",
      },
      { property: "og:title", content: "Månadsagenda – KMA Ledningssystem" },
      {
        property: "og:description",
        content: "Månadens ISO-moment med deadlines och åtgärder.",
      },
    ],
  }),
  component: MonthPage,
});

function MonthPage() {
  const { month } = useParams({ from: "/_authenticated/manad/$month" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const monthNumber = Math.min(12, Math.max(1, Number(month) || 1));

  const { data: activities = [] } = useQuery(activitiesQuery());
  const { data: deviations = [] } = useQuery(deviationsQuery());
  const monthActivities = activities.filter((a) => a.month === monthNumber);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deviationFor, setDeviationFor] = useState<Activity | null>(null);
  const selected = monthActivities.find((a) => a.id === selectedId) ?? monthActivities[0];

  const updateActivity = useMutation({
    mutationFn: async (payload: {
      id: string;
      status?: ActivityStatus;
      checklist?: { text: string; done: boolean }[];
    }) => {
      const { id, ...fields } = payload;
      const { error } = await supabase
        .from("activities")
        .update({
          ...fields,
          completed_at: fields.status === "klar" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Aktiviteten uppdaterad");
    },
    onError: () => toast.error("Kunde inte uppdatera aktiviteten"),
  });

  function goto(delta: number) {
    const next = ((monthNumber - 1 + delta + 12) % 12) + 1;
    setSelectedId(null);
    navigate({ to: "/manad/$month", params: { month: String(next) } });
  }

  function toggleChecklist(activity: Activity, index: number) {
    const list = activity.checklist.map((item, i) => ({
      text: checklistText(item),
      done: i === index ? !checklistDone(item) : checklistDone(item),
    }));
    const allDone = list.every((i) => i.done);
    const someDone = list.some((i) => i.done);
    updateActivity.mutate({
      id: activity.id,
      checklist: list,
      status: allDone ? "klar" : someDone ? "pagaende" : "ej_paborjad",
    });
  }

  return (
    <AppShell
      title={`${MONTHS[monthNumber - 1]} ${CURRENT_YEAR}`}
      subtitle={`Kvartal ${Math.floor((monthNumber - 1) / 3) + 1} · ${monthActivities.length} aktiviteter`}
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => goto(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => goto(1)}>
            <ChevronRight className="size-4" />
          </Button>
          <Link to="/arshjul">
            <Button size="sm" variant="secondary">
              Till årshjulet
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section className="space-y-3">
          {monthActivities.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Inga planerade aktiviteter denna månad.
            </p>
          ) : null}
          {monthActivities.map((a) => {
            const st = effectiveStatus(a);
            const doneCount = a.checklist.filter(checklistDone).length;
            return (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`w-full rounded-xl border bg-card p-4 text-left shadow-panel transition-colors ${
                  selected?.id === a.id ? "border-primary" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold text-white"
                      style={{ backgroundColor: AREA_VAR[a.area] }}
                    >
                      {AREA_SHORT[a.area]}
                    </span>
                    <p className="mt-2 font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ACTIVITY_TYPE_LABEL[a.activity_type] ?? a.activity_type} ·{" "}
                      {a.responsible_role}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={st === "forsenad" ? "destructive" : st === "klar" ? "secondary" : "outline"}>
                      {STATUS_LABEL[st]}
                    </Badge>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(a.due_date)}</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${a.checklist.length ? (doneCount / a.checklist.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </section>

        {selected ? (
          <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-panel">
            <h2 className="text-lg font-semibold text-foreground">{selected.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{selected.description}</p>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Ansvarig roll</dt>
                <dd className="text-foreground">{selected.responsible_role}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Deadline</dt>
                <dd className="text-foreground">{formatDate(selected.due_date)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Kopplade ISO-krav</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {selected.iso_clauses.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    selected.iso_clauses.map((clause) => (
                      <Badge key={clause} variant="secondary">
                        {clause}
                      </Badge>
                    ))
                  )}
                </dd>
              </div>
            </dl>

            <h3 className="mt-6 text-sm font-semibold text-foreground">Checklista</h3>
            <ul className="mt-2 space-y-2">
              {selected.checklist.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--primary)]"
                    checked={checklistDone(item)}
                    onChange={() => toggleChecklist(selected, index)}
                  />
                  <span
                    className={
                      checklistDone(item) ? "text-muted-foreground line-through" : "text-foreground"
                    }
                  >
                    {checklistText(item)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-2">
              {(["ej_paborjad", "pagaende", "klar"] as const).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={selected.status === status ? "default" : "outline"}
                  onClick={() => updateActivity.mutate({ id: selected.id, status })}
                >
                  {STATUS_LABEL[status]}
                </Button>
              ))}
              <Button size="sm" variant="secondary" onClick={() => setDeviationFor(selected)}>
                Logga avvikelse / tillbud
              </Button>
            </div>

            <h3 className="mt-6 text-sm font-semibold text-foreground">Kopplade avvikelser</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {deviations.filter((d) => d.activity_id === selected.id).length === 0 ? (
                <li className="text-muted-foreground">Inga registrerade.</li>
              ) : (
                deviations
                  .filter((d) => d.activity_id === selected.id)
                  .map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2">
                      <span className="text-foreground">
                        {d.reference} · {d.title}
                      </span>
                      <Badge variant="outline">{DEVIATION_STATUS_LABEL[d.status]}</Badge>
                    </li>
                  ))
              )}
            </ul>
          </aside>
        ) : null}
      </div>

      <DeviationDialog
        activity={deviationFor}
        open={Boolean(deviationFor)}
        onClose={() => setDeviationFor(null)}
      />
    </AppShell>
  );
}
