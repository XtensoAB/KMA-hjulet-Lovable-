import { useState } from "react";

import {
  AREA_ORDER,
  AREA_SHORT,
  AREA_VAR,
  MONTHS_SHORT,
  effectiveStatus,
  type Activity,
  type Area,
} from "@/lib/kma";

const SIZE = 620;
const C = SIZE / 2;
const INNER = 96;
const BAND = 40;
const GAP = 3;

function polar(radius: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: C + radius * Math.cos(a), y: C + radius * Math.sin(a) };
}

function sectorPath(r0: number, r1: number, a0: number, a1: number) {
  const p0 = polar(r1, a0);
  const p1 = polar(r1, a1);
  const p2 = polar(r0, a1);
  const p3 = polar(r0, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return [
    `M ${p0.x} ${p0.y}`,
    `A ${r1} ${r1} 0 ${large} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${r0} ${r0} 0 ${large} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ");
}

export function YearWheel({
  activities,
  onSelectMonth,
}: {
  activities: Activity[];
  onSelectMonth: (month: number) => void;
}) {
  const [hover, setHover] = useState<{ activity: Activity; x: number; y: number } | null>(null);
  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-[620px]">
        {/* månadssektorer bakgrund */}
        {MONTHS_SHORT.map((label, i) => {
          const month = i + 1;
          const a0 = i * 30;
          const a1 = a0 + 30;
          const outer = INNER + AREA_ORDER.length * BAND;
          const mid = polar(outer + 26, a0 + 15);
          return (
            <g key={label}>
              <path
                d={sectorPath(INNER - 8, outer + 6, a0, a1)}
                fill={
                  month === currentMonth ? "var(--accent)" : "color-mix(in oklab, var(--muted) 60%, white)"
                }
                stroke="var(--border)"
                strokeWidth={1}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => onSelectMonth(month)}
              />
              <text
                x={mid.x}
                y={mid.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none select-none fill-muted-foreground text-[13px] font-semibold"
                style={{ fill: month === currentMonth ? "var(--primary)" : undefined }}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* aktiviteter per område/ring */}
        {AREA_ORDER.map((area, ringIndex) => {
          const r0 = INNER + ringIndex * BAND;
          const r1 = r0 + BAND - 4;
          return (
            <g key={area}>
              {MONTHS_SHORT.map((_, i) => {
                const month = i + 1;
                const items = activities.filter((a) => a.month === month && a.area === area);
                if (items.length === 0) return null;
                const span = (30 - GAP * 2) / items.length;
                return items.map((activity, idx) => {
                  const a0 = i * 30 + GAP + idx * span;
                  const a1 = a0 + span - (items.length > 1 ? 1 : 0);
                  const status = effectiveStatus(activity);
                  const fill = AREA_VAR[area as Area];
                  const opacity =
                    status === "klar" ? 1 : status === "pagaende" ? 0.62 : status === "forsenad" ? 0.5 : 0.28;
                  return (
                    <path
                      key={activity.id}
                      d={sectorPath(r0 + 2, r1, a0, a1)}
                      fill={fill}
                      fillOpacity={opacity}
                      stroke={status === "forsenad" ? "var(--destructive)" : "white"}
                      strokeWidth={status === "forsenad" ? 2.5 : 1}
                      className="cursor-pointer transition-all hover:brightness-110"
                      onMouseEnter={(e) =>
                        setHover({ activity, x: e.clientX, y: e.clientY })
                      }
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onSelectMonth(month)}
                    />
                  );
                });
              })}
            </g>
          );
        })}

        {/* kvartalslinjer */}
        {[0, 90, 180, 270].map((angle) => {
          const p0 = polar(INNER - 8, angle);
          const p1 = polar(INNER + AREA_ORDER.length * BAND + 40, angle);
          return (
            <line
              key={angle}
              x1={p0.x}
              y1={p0.y}
              x2={p1.x}
              y2={p1.y}
              stroke="var(--primary)"
              strokeOpacity={0.35}
              strokeWidth={1.5}
            />
          );
        })}
        {["Q1", "Q2", "Q3", "Q4"].map((q, i) => {
          const p = polar(INNER + AREA_ORDER.length * BAND + 52, i * 90 + 45);
          return (
            <text
              key={q}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="select-none text-[15px] font-bold"
              style={{ fill: "var(--primary)", opacity: 0.65 }}
            >
              {q}
            </text>
          );
        })}

        <circle cx={C} cy={C} r={INNER - 14} fill="var(--card)" stroke="var(--border)" />
        <text
          x={C}
          y={C - 10}
          textAnchor="middle"
          className="select-none text-[15px] font-semibold"
          style={{ fill: "var(--foreground)" }}
        >
          Årshjul
        </text>
        <text
          x={C}
          y={C + 14}
          textAnchor="middle"
          className="select-none text-[22px] font-bold"
          style={{ fill: "var(--primary)" }}
        >
          {activities[0]?.year ?? new Date().getFullYear()}
        </text>
      </svg>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        {AREA_ORDER.map((area) => (
          <span key={area} className="flex items-center gap-2">
            <span
              className="size-3 rounded-sm"
              style={{ backgroundColor: AREA_VAR[area] }}
            />
            {AREA_SHORT[area]}
          </span>
        ))}
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-sm border-2 border-destructive" /> Försenad
        </span>
        <span>Fylld = klar · halvton = pågående · blek = ej påbörjad</span>
      </div>

      {hover ? (
        <div
          className="pointer-events-none fixed z-50 max-w-xs rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-panel"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <p className="font-semibold text-popover-foreground">{hover.activity.title}</p>
          <p className="mt-1 text-muted-foreground">
            {hover.activity.responsible_role} · deadline {hover.activity.due_date}
          </p>
        </div>
      ) : null}
    </div>
  );
}
