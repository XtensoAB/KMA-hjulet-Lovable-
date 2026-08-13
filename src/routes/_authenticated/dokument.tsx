import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Sparkles, Trash2, Upload } from "lucide-react";

import { AppShell } from "@/components/kma/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { analyzeDocument } from "@/lib/documents.functions";
import {
  ACTIVITY_TYPE_LABEL,
  AREA_SHORT,
  AREA_VAR,
  MONTHS,
  type Area,
  formatDate,
} from "@/lib/kma";
import {
  CURRENT_YEAR,
  documentsQuery,
  suggestionsQuery,
  type DocumentRow,
  type SuggestionRow,
} from "@/lib/kma-queries";

const BUCKET = "ledningssystem-dokument";
const ACCEPT = ".pdf,.txt,.md,.csv,text/plain,application/pdf";

export const Route = createFileRoute("/_authenticated/dokument")({
  head: () => ({
    meta: [
      { title: "Dokument & AI-förslag – Ledningssystem" },
      {
        name: "description",
        content:
          "Ladda upp era ledningssystemdokument och låt AI föreslå aktiviteter och KMA-mål till årsagendan.",
      },
      { property: "og:title", content: "Dokument & AI-förslag – Ledningssystem" },
      {
        property: "og:description",
        content: "AI-analys av policyer och rutiner ger förslag till årshjulet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentsPage,
});

const STATUS_LABEL: Record<string, string> = {
  ny: "Ej analyserad",
  analyseras: "Analyseras…",
  analyserad: "Analyserad",
  fel: "Analys misslyckades",
};

function dueDateFor(month: number): string {
  const last = new Date(Date.UTC(CURRENT_YEAR, month, 0)).getUTCDate();
  return `${CURRENT_YEAR}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

function DocumentsPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const { data: documents = [] } = useQuery(documentsQuery());
  const { data: suggestions = [] } = useQuery(suggestionsQuery());
  const runAnalysis = useServerFn(analyzeDocument);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const upload = await supabase.storage.from(BUCKET).upload(path, file);
      if (upload.error) throw upload.error;

      const { error } = await supabase.from("documents").insert({
        title: file.name,
        file_path: path,
        mime_type: file.type || "text/plain",
        size_bytes: file.size,
      });
      if (error) throw error;

      toast.success("Dokumentet är uppladdat");
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Uppladdningen misslyckades");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function analyze(doc: DocumentRow) {
    setAnalyzingId(doc.id);
    try {
      const result = await runAnalysis({ data: { documentId: doc.id } });
      toast.success(`${result.count} förslag genererade från ${doc.title}`);
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({ queryKey: ["ai_suggestions"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI-analysen misslyckades");
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    } finally {
      setAnalyzingId(null);
    }
  }

  const removeDocument = useMutation({
    mutationFn: async (doc: DocumentRow) => {
      await supabase.storage.from(BUCKET).remove([doc.file_path]);
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Dokumentet borttaget");
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({ queryKey: ["ai_suggestions"] });
    },
    onError: () => toast.error("Kunde inte ta bort dokumentet"),
  });

  const decide = useMutation({
    mutationFn: async ({ s, accept }: { s: SuggestionRow; accept: boolean }) => {
      if (accept && s.kind === "activity") {
        const month = s.month ?? 1;
        const { error } = await supabase.from("activities").insert({
          year: CURRENT_YEAR,
          month,
          quarter: Math.ceil(month / 3),
          title: s.title,
          description: s.description,
          area: s.area as Area,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          activity_type: (s.activity_type ?? "policy") as any,
          responsible_role: s.responsible_role ?? "KMA-ansvarig",
          due_date: dueDateFor(month),
          checklist: Array.isArray(s.checklist) ? s.checklist : [],
          iso_clauses: s.iso_clauses ?? [],
          recurring: false,
        });
        if (error) throw error;
      }
      if (accept && s.kind === "objective") {
        const { error } = await supabase.from("objectives").insert({
          year: CURRENT_YEAR,
          area: s.area as Area,
          title: s.title,
          unit: s.unit,
          baseline: s.baseline,
          target: s.target,
          current_value: s.baseline,
          responsible_role: s.responsible_role,
        });
        if (error) throw error;
      }
      const { error } = await supabase
        .from("ai_suggestions")
        .update({ status: accept ? "godkand" : "avfardad" })
        .eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: async (_data, variables) => {
      toast.success(
        variables.accept ? "Tillagt i årsagendan" : "Förslaget avfärdat",
      );
      await queryClient.invalidateQueries({ queryKey: ["ai_suggestions"] });
      await queryClient.invalidateQueries({ queryKey: ["activities", CURRENT_YEAR] });
      await queryClient.invalidateQueries({ queryKey: ["objectives", CURRENT_YEAR] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Något gick fel"),
  });

  const activitySuggestions = suggestions.filter((s) => s.kind === "activity");
  const objectiveSuggestions = suggestions.filter((s) => s.kind === "objective");

  return (
    <AppShell
      title="Dokument & AI-förslag"
      subtitle="Ladda upp policyer, rutiner och revisionsrapporter – AI föreslår aktiviteter och mål"
      actions={
        <>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Ladda upp dokument
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Uppladdade dokument
          </h2>
          {documents.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Inga dokument ännu. Ladda upp PDF- eller textfiler med er kvalitets-, miljö- och
              arbetsmiljödokumentation.
            </p>
          )}
          {documents.map((doc) => (
            <article
              key={doc.id}
              className="rounded-xl border border-border bg-card p-4 shadow-panel"
            >
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{doc.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(doc.created_at)} · {Math.max(1, Math.round(doc.size_bytes / 1024))} kB ·{" "}
                    {STATUS_LABEL[doc.analysis_status] ?? doc.analysis_status}
                  </p>
                </div>
                <button
                  onClick={() => removeDocument.mutate(doc)}
                  className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={`Ta bort ${doc.title}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {doc.analysis_summary && (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {doc.analysis_summary}
                </p>
              )}

              <Button
                variant="secondary"
                size="sm"
                className="mt-3 w-full"
                disabled={analyzingId === doc.id}
                onClick={() => void analyze(doc)}
              >
                {analyzingId === doc.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {doc.analysis_status === "analyserad" ? "Analysera igen" : "Analysera med AI"}
              </Button>
            </article>
          ))}
        </section>

        <section className="space-y-6">
          <SuggestionGroup
            heading={`Föreslagna aktiviteter (${activitySuggestions.length})`}
            items={activitySuggestions}
            onDecide={(s, accept) => decide.mutate({ s, accept })}
          />
          <SuggestionGroup
            heading={`Föreslagna KMA-mål (${objectiveSuggestions.length})`}
            items={objectiveSuggestions}
            onDecide={(s, accept) => decide.mutate({ s, accept })}
          />
        </section>
      </div>
    </AppShell>
  );
}

function SuggestionGroup({
  heading,
  items,
  onDecide,
}: {
  heading: string;
  items: SuggestionRow[];
  onDecide: (s: SuggestionRow, accept: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {heading}
      </h2>
      {items.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          Inga öppna förslag. Analysera ett dokument för att få förslag.
        </p>
      )}
      {items.map((s) => (
        <article key={s.id} className="rounded-xl border border-border bg-card p-4 shadow-panel">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-[11px] font-semibold text-white"
              style={{ backgroundColor: AREA_VAR[s.area as Area] }}
            >
              {AREA_SHORT[s.area as Area]}
            </span>
            {s.kind === "activity" && s.month && (
              <span className="text-xs text-muted-foreground">{MONTHS[s.month - 1]}</span>
            )}
            {s.activity_type && (
              <span className="text-xs text-muted-foreground">
                {ACTIVITY_TYPE_LABEL[s.activity_type] ?? s.activity_type}
              </span>
            )}
            {s.kind === "objective" && s.target !== null && (
              <span className="text-xs text-muted-foreground">
                Mål: {s.target} {s.unit ?? ""}
              </span>
            )}
          </div>

          <h3 className="mt-2 text-base font-semibold text-foreground">{s.title}</h3>
          {s.description && (
            <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
          )}
          {s.rationale && (
            <p className="mt-2 text-xs italic text-muted-foreground">{s.rationale}</p>
          )}
          {s.iso_clauses.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              ISO-krav: {s.iso_clauses.join(", ")}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Ansvarig: {s.responsible_role ?? "—"}
          </p>

          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => onDecide(s, true)}>
              Lägg till i årsagendan
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDecide(s, false)}>
              Avfärda
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
