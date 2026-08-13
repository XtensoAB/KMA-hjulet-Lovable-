import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, TriangleAlert, Timer } from "lucide-react";

import { AppShell } from "@/components/kma/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AREA_ORDER,
  AREA_SHORT,
  AREA_VAR,
  DEVIATION_TYPE_LABEL,
  DEVIATION_STATUS_LABEL,
  MONTHS,
  STATUS_LABEL,
  daysUntil,
  effectiveStatus,
  formatDate,
} from "@/lib/kma";
import { activitiesQuery, deviationsQuery, CURRENT_YEAR } from "@/lib/kma-queries";
import { exportManagementReview } from "@/lib/kma-export";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard – KMA Ledningssystem" },
      {
        name: "description",
        content:
          "KPI:er för efterlevnad: genomförda årsaktiviteter, öppna avvikelser och kommande deadlines.",
      },
      { property: "og:title", content: "Dashboard – KMA Ledningssystem" },
      {
        property: "og:description",
        content: "Statusöversikt för ISO 9001, 14001 och 45001.",
      },
    ],
  }),
  component: Dashboard,
});

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-panel">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Dashboard() {
  const { data: activities = [] } = useQuery(activitiesQuery());
  const { data: deviations = [] } = useQuery(deviationsQuery());

  const done = activities.filter((a) => a.status === "klar");
  const overdue = activities.filter((a) => effectiveStatus(a) === "forsenad");
  const passed = activities.filter((a) => new Date(a.due_date) <= new Date());
  const onTimePct = passed.length
    ? Math.round((passed.filter((a) => a.status === "klar").length / passed.length) * 100)
    : 100;
  const open = deviations.filter((d) => d.status !== "stangd");
  const closed = deviations.filter((d) => d.status === "stangd");
  const upcoming = activities
    .filter((a) => a.status !== "klar" && daysUntil(a.due_date) >= 0 && daysUntil(a.due_date) <= 30)
    .slice(0, 6);

  return (
    <AppShell
      title="Dashboard"
      subtitle={`Efterlevnadsstatus för verksamhetsåret ${CURRENT_YEAR}`}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportManagementReview(activities, deviations)}
        >
          Exportera underlag (CSV)
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Genomförda i tid"
          value={`${onTimePct}%`}
          hint={`${done.length} av ${activities.length} årsaktiviteter klara`}
          icon={CheckCircle2}
        />
        <Kpi
          label="Öppna avvikelser"
          value={String(open.length)}
          hint={`${closed.length} stängda totalt`}
          icon={TriangleAlert}
        />
        <Kpi
          label="Deadlines inom 30 dagar"
          value={String(upcoming.length)}
          hint="Aktiviteter som kräver åtgärd"
          icon={CalendarClock}
        />
        <Kpi
          label="Försenade aktiviteter"
          value={String(overdue.length)}
          hint="Passerad deadline, ej klara"
          icon={Timer}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-panel">
          <h2 className="text-base font-semibold text-foreground">Kommande 30 dagar</h2>
          <ul className="mt-4 divide-y divide-border">
            {upcoming.length === 0 ? (
              <li className="py-3 text-sm text-muted-foreground">Inga deadlines inom 30 dagar.</li>
            ) : (
              upcoming.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <Link
                      to="/manad/$month"
                      params={{ month: String(a.month) }}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {a.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {a.responsible_role} · {MONTHS[a.month - 1]}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(a.due_date)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-panel">
          <h2 className="text-base font-semibold text-foreground">Efterlevnad per område</h2>
          <div className="mt-4 space-y-4">
            {AREA_ORDER.map((area) => {
              const rows = activities.filter((a) => a.area === area);
              const pct = rows.length
                ? Math.round((rows.filter((a) => a.status === "klar").length / rows.length) * 100)
                : 0;
              return (
                <div key={area}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{AREA_SHORT[area]}</span>
                    <span className="text-muted-foreground">
                      {pct}% ({rows.length} aktiviteter)
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: AREA_VAR[area] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-panel">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Senaste avvikelser</h2>
          <Link to="/avvikelser" className="text-sm text-primary hover:underline">
            Visa alla
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-border">
          {deviations.slice(0, 5).map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {d.reference} · {d.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {DEVIATION_TYPE_LABEL[d.type]} · {d.responsible_role ?? "Ej tilldelad"}
                </p>
              </div>
              <Badge variant={d.status === "stangd" ? "secondary" : "default"}>
                {DEVIATION_STATUS_LABEL[d.status]}
              </Badge>
            </li>
          ))}
          {deviations.length === 0 ? (
            <li className="py-3 text-sm text-muted-foreground">
              Inga avvikelser registrerade än.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-panel">
        <h2 className="text-base font-semibold text-foreground">Statusfördelning</h2>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {(["klar", "pagaende", "ej_paborjad", "forsenad"] as const).map((status) => (
            <span
              key={status}
              className="rounded-md border border-border bg-secondary px-3 py-2 text-secondary-foreground"
            >
              {STATUS_LABEL[status]}:{" "}
              <strong>{activities.filter((a) => effectiveStatus(a) === status).length}</strong>
            </span>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
