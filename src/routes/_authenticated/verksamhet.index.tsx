import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/kma/AppShell";
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  COMM_STATUS_LABEL,
} from "@/lib/business";
import {
  businessActivitiesQuery,
  businessGoalItemsQuery,
  businessGoalsQuery,
  communicationLogsQuery,
  stakeholdersQuery,
} from "@/lib/business-queries";
import { MONTHS, formatDate } from "@/lib/kma";
import { CURRENT_YEAR } from "@/lib/kma-queries";

export const Route = createFileRoute("/_authenticated/verksamhet/")({
  head: () => ({
    meta: [
      { title: "Bolagets styrning – mål, årshjul och kommunikation" },
      {
        name: "description",
        content:
          "Översikt över bolagets mål, delmål, återkommande bolagsaktiviteter och kommunikationsinsatser per intressent.",
      },
      { property: "og:title", content: "Bolagets styrning – översikt" },
      {
        property: "og:description",
        content: "Mål, aktiviteter, årshjul och kommunikationsplan för bolaget.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessDashboard,
});

function BusinessDashboard() {
  const { data: goals = [] } = useQuery(businessGoalsQuery());
  const { data: items = [] } = useQuery(businessGoalItemsQuery());
  const { data: activities = [] } = useQuery(businessActivitiesQuery());
  const { data: logs = [] } = useQuery(communicationLogsQuery());
  const { data: stakeholders = [] } = useQuery(stakeholdersQuery());

  const thisMonth = new Date().getMonth() + 1;
  const monthActivities = activities.filter((a) => a.month === thisMonth);
  const doneItems = items.filter((i) => i.status === "klar").length;
  const performed = logs.filter((l) => l.status === "genomford").length;
  const planned = logs.filter((l) => l.status === "planerad").length;

  const stakeholderName = (id: string | null) =>
    stakeholders.find((s) => s.id === id)?.name ?? "—";

  return (
    <AppShell
      title={`Bolagets styrning ${CURRENT_YEAR}`}
      subtitle="Mål och aktiviteter, årshjul och kommunikationsplan"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Bolagsmål" value={goals.length} hint={`${items.length} delmål/aktiviteter`} />
        <Kpi
          label="Klara aktiviteter"
          value={doneItems}
          hint={items.length ? `av ${items.length}` : "inga registrerade"}
        />
        <Kpi label="Bolagsaktiviteter i år" value={activities.length} hint={`${monthActivities.length} denna månad`} />
        <Kpi label="Kommunikation" value={performed} hint={`${planned} planerade`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {MONTHS[thisMonth - 1]} – bolagsaktiviteter
            </h2>
            <Link to="/verksamhet/arshjul" className="text-xs text-primary hover:underline">
              Till årshjulet
            </Link>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {monthActivities.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLOR[a.category] }}
                />
                <span className="text-foreground">{a.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {CATEGORY_LABEL[a.category]}
                </span>
              </li>
            ))}
            {monthActivities.length === 0 ? (
              <li className="text-sm text-muted-foreground">Inga aktiviteter denna månad.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Senaste kommunikation</h2>
            <Link to="/verksamhet/kommunikation" className="text-xs text-primary hover:underline">
              Till kommunikationsplanen
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {logs.slice(0, 6).map((l) => (
              <li key={l.id} className="border-b border-border pb-2 last:border-0">
                <p className="font-medium text-foreground">{l.title}</p>
                <p className="text-xs text-muted-foreground">
                  {stakeholderName(l.stakeholder_id)} · {l.channel ?? "—"} ·{" "}
                  {formatDate(l.planned_date)} · {COMM_STATUS_LABEL[l.status]}
                </p>
              </li>
            ))}
            {logs.length === 0 ? (
              <li className="text-sm text-muted-foreground">Inget loggat ännu.</li>
            ) : null}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-panel">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Aktiviteter per kategori</h2>
          <Link to="/verksamhet/mal" className="text-xs text-primary hover:underline">
            Till mål & aktiviteter
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_ORDER.map((c) => {
            const count = activities.filter((a) => a.category === c).length;
            return (
              <div key={c} className="rounded-lg border border-border p-4">
                <span
                  className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold text-white"
                  style={{ backgroundColor: CATEGORY_COLOR[c] }}
                >
                  {CATEGORY_LABEL[c]}
                </span>
                <p className="mt-2 text-2xl font-semibold text-foreground">{count}</p>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function Kpi({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-panel">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
