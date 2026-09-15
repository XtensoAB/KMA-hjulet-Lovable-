import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

import { BusinessActivityDialog } from "@/components/business/BusinessActivityDialog";
import { AppShell } from "@/components/kma/AppShell";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  type BusinessCategory,
} from "@/lib/business";
import { businessActivitiesQuery } from "@/lib/business-queries";
import { MONTHS, MONTHS_SHORT, STATUS_LABEL } from "@/lib/kma";
import { CURRENT_YEAR } from "@/lib/kma-queries";

export const Route = createFileRoute("/_authenticated/verksamhet/arshjul")({
  head: () => ({
    meta: [
      { title: "Bolagets årshjul – återkommande aktiviteter" },
      {
        name: "description",
        content:
          "Återkommande bolagsaktiviteter per månad inom Personal, Företag, Styrelse och Externt.",
      },
      { property: "og:title", content: "Bolagets årshjul" },
      {
        property: "og:description",
        content: "Planera återkommande bolagsaktiviteter månad för månad.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessYearWheelPage,
});

const SIZE = 620;
const CENTER = SIZE / 2;
const OUTER = 290;
const INNER = 110;

function polar(radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) };
}

function segmentPath(r1: number, r2: number, a1: number, a2: number) {
  const p1 = polar(r2, a1);
  const p2 = polar(r2, a2);
  const p3 = polar(r1, a2);
  const p4 = polar(r1, a1);
  return `M ${p1.x} ${p1.y} A ${r2} ${r2} 0 0 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${r1} ${r1} 0 0 0 ${p4.x} ${p4.y} Z`;
}

function BusinessYearWheelPage() {
  const { data: activities = [] } = useQuery(businessActivitiesQuery());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState<BusinessCategory | "alla">("alla");
  const [month, setMonth] = useState<number | null>(null);

  const filtered = activities.filter((a) => category === "alla" || a.category === category);
  const ringCount = CATEGORY_ORDER.length;
  const ringWidth = (OUTER - INNER) / ringCount;

  const selected = month
    ? filtered.filter((a) => a.month === month)
    : filtered;

  return (
    <AppShell
      title={`Bolagets årshjul ${CURRENT_YEAR}`}
      subtitle="Återkommande aktiviteter inom Personal, Företag, Styrelse och Externt"
      actions={
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" /> Ny aktivitet
        </Button>
      }
    >
      <BusinessActivityDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={category === "alla" ? "default" : "outline"}
          onClick={() => setCategory("alla")}
        >
          Alla kategorier
        </Button>
        {CATEGORY_ORDER.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "default" : "outline"}
            onClick={() => setCategory(c)}
          >
            {CATEGORY_LABEL[c]}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border border-border bg-card p-4 shadow-panel">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-[620px]">
            {MONTHS.map((_, mi) => {
              const a1 = mi * 30;
              const a2 = a1 + 30;
              return (
                <g key={mi}>
                  {CATEGORY_ORDER.map((cat, ri) => {
                    const r1 = INNER + ri * ringWidth;
                    const r2 = r1 + ringWidth;
                    const has = filtered.some(
                      (a) => a.month === mi + 1 && a.category === cat,
                    );
                    const count = filtered.filter(
                      (a) => a.month === mi + 1 && a.category === cat,
                    ).length;
                    const mid = polar((r1 + r2) / 2, a1 + 15);
                    return (
                      <g key={cat} onClick={() => setMonth(mi + 1)} className="cursor-pointer">
                        <path
                          d={segmentPath(r1, r2, a1 + 0.6, a2 - 0.6)}
                          fill={CATEGORY_COLOR[cat]}
                          opacity={has ? 0.85 : 0.12}
                          stroke="var(--card)"
                          strokeWidth={1}
                        />
                        {count > 0 ? (
                          <text
                            x={mid.x}
                            y={mid.y + 4}
                            textAnchor="middle"
                            className="fill-white text-[11px] font-semibold"
                          >
                            {count}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
                  {(() => {
                    const p = polar(OUTER + 22, a1 + 15);
                    return (
                      <text
                        x={p.x}
                        y={p.y + 4}
                        textAnchor="middle"
                        className={`text-[12px] ${
                          month === mi + 1
                            ? "fill-[var(--primary)] font-bold"
                            : "fill-[var(--muted-foreground)]"
                        }`}
                        onClick={() => setMonth(mi + 1)}
                      >
                        {MONTHS_SHORT[mi]}
                      </text>
                    );
                  })()}
                </g>
              );
            })}
            <circle cx={CENTER} cy={CENTER} r={INNER - 6} fill="var(--muted)" />
            <text
              x={CENTER}
              y={CENTER - 4}
              textAnchor="middle"
              className="fill-[var(--foreground)] text-[20px] font-semibold"
            >
              {CURRENT_YEAR}
            </text>
            <text
              x={CENTER}
              y={CENTER + 18}
              textAnchor="middle"
              className="fill-[var(--muted-foreground)] text-[12px]"
            >
              Bolagsaktiviteter
            </text>
          </svg>

          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            {CATEGORY_ORDER.map((c) => (
              <span key={c} className="flex items-center gap-2">
                <span
                  className="size-3 rounded-sm"
                  style={{ backgroundColor: CATEGORY_COLOR[c] }}
                />
                {CATEGORY_LABEL[c]}
              </span>
            ))}
          </div>
        </div>

        <aside className="rounded-xl border border-border bg-card p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {month ? MONTHS[month - 1] : "Hela året"}
            </h2>
            {month ? (
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => setMonth(null)}
              >
                Visa hela året
              </button>
            ) : null}
          </div>
          <ul className="mt-4 space-y-3">
            {selected.map((a) => (
              <li key={a.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLOR[a.category] }}
                  />
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {CATEGORY_LABEL[a.category]} · {MONTHS[a.month - 1]} ·{" "}
                  {a.responsible_role ?? "—"} · {STATUS_LABEL[a.status]}
                  {a.recurring ? " · återkommande" : ""}
                </p>
                {a.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                ) : null}
              </li>
            ))}
            {selected.length === 0 ? (
              <li className="text-sm text-muted-foreground">Inga aktiviteter att visa.</li>
            ) : null}
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
