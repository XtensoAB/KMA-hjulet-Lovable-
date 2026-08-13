import {
  ACTIVITY_TYPE_LABEL,
  AREA_SHORT,
  DEVIATION_STATUS_LABEL,
  DEVIATION_TYPE_LABEL,
  MONTHS,
  STATUS_LABEL,
  effectiveStatus,
  type Activity,
  type Deviation,
} from "@/lib/kma";

function escapeCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: unknown[][]): string {
  return rows.map((row) => row.map(escapeCell).join(";")).join("\r\n");
}

function download(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportManagementReview(activities: Activity[], deviations: Deviation[]) {
  const rows: unknown[][] = [
    ["Underlag Ledningens genomgång", new Date().toLocaleDateString("sv-SE")],
    [],
    ["Årsaktiviteter"],
    ["Månad", "Kvartal", "Aktivitet", "Område", "Typ", "Ansvarig", "Deadline", "Status", "ISO-krav"],
  ];

  for (const a of activities) {
    rows.push([
      MONTHS[a.month - 1],
      `Q${a.quarter}`,
      a.title,
      AREA_SHORT[a.area],
      ACTIVITY_TYPE_LABEL[a.activity_type] ?? a.activity_type,
      a.responsible_role,
      a.due_date,
      STATUS_LABEL[effectiveStatus(a)],
      a.iso_clauses.join(", "),
    ]);
  }

  rows.push([], ["Avvikelser, tillbud och förbättringsförslag"]);
  rows.push(["Nr", "Typ", "Titel", "Område", "Ansvarig", "Rapporterad", "Deadline", "Status"]);
  for (const d of deviations) {
    rows.push([
      d.reference,
      DEVIATION_TYPE_LABEL[d.type],
      d.title,
      AREA_SHORT[d.area],
      d.responsible_role ?? "",
      new Date(d.reported_at).toLocaleDateString("sv-SE"),
      d.due_date ?? "",
      DEVIATION_STATUS_LABEL[d.status],
    ]);
  }

  download(`ledningens-genomgang-${new Date().getFullYear()}.csv`, toCsv(rows));
}
