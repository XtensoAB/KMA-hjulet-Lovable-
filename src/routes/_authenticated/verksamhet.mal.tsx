import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BusinessGoalDialog } from "@/components/business/BusinessGoalDialog";
import { GoalItemDialog } from "@/components/business/GoalItemDialog";
import { AppShell } from "@/components/kma/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  EFFORT_LABEL,
  IMPORTANCE_LABEL,
  KIND_LABEL,
  type BusinessGoalItem,
  type Effort,
  type Importance,
} from "@/lib/business";
import { businessGoalItemsQuery, businessGoalsQuery } from "@/lib/business-queries";
import { STATUS_LABEL, formatDate, type ActivityStatus } from "@/lib/kma";
import { CURRENT_YEAR } from "@/lib/kma-queries";

export const Route = createFileRoute("/_authenticated/verksamhet/mal")({
  head: () => ({
    meta: [
      { title: "Bolagsmål, delmål och aktiviteter" },
      {
        name: "description",
        content:
          "Bolagets mål med delmål och aktiviteter, prioriterade efter viktighet och hur lätta de är att genomföra.",
      },
      { property: "og:title", content: "Bolagsmål, delmål och aktiviteter" },
      {
        property: "og:description",
        content: "Prioriteringsmatris för bolagets delmål och aktiviteter.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessGoalsPage,
});

const QUADRANTS: { importance: Importance; effort: Effort; label: string }[] = [
  { importance: "viktig", effort: "latt", label: "Viktig · lätt att genomföra – gör nu" },
  { importance: "viktig", effort: "svar", label: "Viktig · svår att genomföra – planera" },
  {
    importance: "mindre_viktig",
    effort: "latt",
    label: "Mindre viktig · lätt att genomföra – snabba vinster",
  },
  {
    importance: "mindre_viktig",
    effort: "svar",
    label: "Mindre viktig · svår att genomföra – avvakta",
  },
];

function BusinessGoalsPage() {
  const queryClient = useQueryClient();
  const { data: goals = [] } = useQuery(businessGoalsQuery());
  const { data: items = [] } = useQuery(businessGoalItemsQuery());
  const [goalOpen, setGoalOpen] = useState(false);
  const [itemGoal, setItemGoal] = useState<{ id: string; title: string } | null>(null);

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ActivityStatus }) => {
      const { error } = await supabase
        .from("business_goal_items")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_goal_items"] });
    },
    onError: () => toast.error("Kunde inte uppdatera status"),
  });

  return (
    <AppShell
      title={`Bolagets mål ${CURRENT_YEAR}`}
      subtitle="Mål, delmål och aktiviteter med prioritering"
      actions={
        <Button size="sm" onClick={() => setGoalOpen(true)}>
          <Plus className="size-4" /> Nytt bolagsmål
        </Button>
      }
    >
      <BusinessGoalDialog open={goalOpen} onClose={() => setGoalOpen(false)} />
      <GoalItemDialog
        open={itemGoal !== null}
        onClose={() => setItemGoal(null)}
        goalId={itemGoal?.id ?? null}
        goalTitle={itemGoal?.title}
      />

      <div className="space-y-5">
        {goals.map((g) => {
          const goalItems = items.filter((i) => i.goal_id === g.id);
          return (
            <section
              key={g.id}
              className="rounded-xl border border-border bg-card p-5 shadow-panel"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{g.title}</h2>
                  {g.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ansvarig: {g.responsible_role ?? "—"}
                    {g.target !== null
                      ? ` · Mål: ${g.target}${g.unit ? " " + g.unit : ""}`
                      : ""}
                    {g.baseline !== null ? ` · Utgång: ${g.baseline}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setItemGoal({ id: g.id, title: g.title })}
                >
                  <Plus className="size-4" /> Delmål / aktivitet
                </Button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {QUADRANTS.map((q) => {
                  const qItems = goalItems.filter(
                    (i) => i.importance === q.importance && i.effort === q.effort,
                  );
                  return (
                    <div key={q.label} className="rounded-lg border border-border p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {q.label}
                      </p>
                      <ul className="mt-2 space-y-2">
                        {qItems.map((i) => (
                          <ItemRow
                            key={i.id}
                            item={i}
                            onStatus={(status) => setStatus.mutate({ id: i.id, status })}
                          />
                        ))}
                        {qItems.length === 0 ? (
                          <li className="text-xs text-muted-foreground">—</li>
                        ) : null}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Inga bolagsmål registrerade för {CURRENT_YEAR}. Skapa det första målet.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}

function ItemRow({
  item,
  onStatus,
}: {
  item: BusinessGoalItem;
  onStatus: (status: ActivityStatus) => void;
}) {
  return (
    <li className="rounded-md bg-muted/40 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-secondary-foreground">
          {KIND_LABEL[item.kind]}
        </span>
        <span className="font-medium text-foreground">{item.title}</span>
        <select
          value={item.status}
          onChange={(e) => onStatus(e.target.value as ActivityStatus)}
          className="ml-auto rounded border border-input bg-background px-2 py-1 text-xs"
        >
          {(["ej_paborjad", "pagaende", "klar"] as const).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {item.responsible_role ?? "—"} · {formatDate(item.due_date)} ·{" "}
        {IMPORTANCE_LABEL[item.importance]} · {EFFORT_LABEL[item.effort]}
      </p>
    </li>
  );
}
