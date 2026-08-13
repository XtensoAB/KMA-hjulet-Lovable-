import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/kma/AppShell";
import { YearWheel } from "@/components/kma/YearWheel";
import { Button } from "@/components/ui/button";
import {
  ACTIVITY_TYPE_LABEL,
  AREA_ORDER,
  AREA_SHORT,
  AREA_VAR,
  MONTHS_SHORT,
  ROLES,
  STATUS_LABEL,
  effectiveStatus,
  type Area,
  type EffectiveStatus,
} from "@/lib/kma";
import { activitiesQuery, CURRENT_YEAR } from "@/lib/kma-queries";

export const Route = createFileRoute("/_authenticated/arshjul")({
  head: () => ({
    meta: [
      { title: "Årshjul – KMA Ledningssystem" },
      {
        name: "description",
        content:
          "Interaktivt årshjul med 12 månader och 4 kvartal för ISO 9001, 14001 och 45001-aktiviteter.",
      },
      { property: "og:title", content: "Årshjul – KMA Ledningssystem" },
      {
        property: "og:description",
        content: "Visuell översikt över årets KMA-aktiviteter, ansvar och deadlines.",
      },
    ],
  }),
  component: YearWheelPage,
});

function YearWheelPage() {
  const navigate = useNavigate();
  const { data: activities = [] } = useQuery(activitiesQuery());
  const [view, setView] = useState<"wheel" | "matrix">("wheel");
  const [area, setArea] = useState<Area | "alla">("alla");
  const [type, setType] = useState<string>("alla");
  const [status, setStatus] = useState<EffectiveStatus | "alla">("alla");
  const [role, setRole] = useState<string>("alla");

  const filtered = activities.filter(
    (a) =>
      (area === "alla" || a.area === area) &&
      (type === "alla" || a.activity_type === type) &&
      (status === "alla" || effectiveStatus(a) === status) &&
      (role === "alla" || a.responsible_role === role),
  );

  const types = Array.from(new Set(activities.map((a) => a.activity_type)));

  return (
    <AppShell
      title={`Årshjul ${CURRENT_YEAR}`}
      subtitle="Klicka på en månad för att öppna månadsagendan"
      actions={
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === "wheel" ? "default" : "outline"}
            onClick={() => setView("wheel")}
          >
            Hjul
          </Button>
          <Button
            size="sm"
            variant={view === "matrix" ? "default" : "outline"}
            onClick={() => setView("matrix")}
          >
            Matris
          </Button>
        </div>
      }
    >
      <div className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-4 shadow-panel sm:grid-cols-2 lg:grid-cols-4">
        <Select label="ISO-område" value={area} onChange={(v) => setArea(v as Area | "alla")}>
          <option value="alla">Alla områden</option>
          {AREA_ORDER.map((a) => (
            <option key={a} value={a}>
              {AREA_SHORT[a]}
            </option>
          ))}
        </Select>
        <Select label="Aktivitetstyp" value={type} onChange={setType}>
          <option value="alla">Alla typer</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {ACTIVITY_TYPE_LABEL[t] ?? t}
            </option>
          ))}
        </Select>
        <Select
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as EffectiveStatus | "alla")}
        >
          <option value="alla">Alla statusar</option>
          {(["ej_paborjad", "pagaende", "klar", "forsenad"] as const).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <Select label="Ansvarig roll" value={role} onChange={setRole}>
          <option value="alla">Alla roller</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-panel">
        {view === "wheel" ? (
          <YearWheel
            activities={filtered}
            onSelectMonth={(month) =>
              navigate({ to: "/manad/$month", params: { month: String(month) } })
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border p-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Område
                  </th>
                  {MONTHS_SHORT.map((m, i) => (
                    <th
                      key={m}
                      className="cursor-pointer border-b border-border p-2 text-xs font-semibold text-muted-foreground hover:text-primary"
                      onClick={() =>
                        navigate({ to: "/manad/$month", params: { month: String(i + 1) } })
                      }
                    >
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AREA_ORDER.map((a) => (
                  <tr key={a}>
                    <td className="border-b border-border p-2 font-medium text-foreground">
                      <span className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-sm"
                          style={{ backgroundColor: AREA_VAR[a] }}
                        />
                        {AREA_SHORT[a]}
                      </span>
                    </td>
                    {MONTHS_SHORT.map((_, i) => {
                      const items = filtered.filter((x) => x.area === a && x.month === i + 1);
                      return (
                        <td
                          key={i}
                          className="border-b border-l border-border p-1 align-top text-[11px]"
                        >
                          {items.map((item) => {
                            const st = effectiveStatus(item);
                            return (
                              <div
                                key={item.id}
                                className="mb-1 cursor-pointer rounded px-1.5 py-1 leading-tight"
                                style={{
                                  backgroundColor: AREA_VAR[a],
                                  opacity: st === "klar" ? 1 : st === "pagaende" ? 0.7 : 0.35,
                                  color: "white",
                                  outline: st === "forsenad" ? "2px solid var(--destructive)" : undefined,
                                }}
                                onClick={() =>
                                  navigate({
                                    to: "/manad/$month",
                                    params: { month: String(item.month) },
                                  })
                                }
                              >
                                {item.title}
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
      >
        {children}
      </select>
    </label>
  );
}
