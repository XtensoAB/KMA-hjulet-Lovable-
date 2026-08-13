import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "ledningssystem-dokument";

const SYSTEM_PROMPT = `Du är en erfaren revisor och konsult inom integrerade ledningssystem (ISO 9001 kvalitet, ISO 14001 miljö, ISO 45001 arbetsmiljö).
Du analyserar ett uppladdat ledningssystemdokument och föreslår konkreta aktiviteter till företagets årsagenda (årshjul) samt mätbara KMA-mål.
Svara ALLTID med enbart giltig JSON enligt schemat, på svenska, utan markdown-kodstaket.

Schema:
{
  "summary": "kort sammanfattning av dokumentet och de viktigaste kraven, max 4 meningar",
  "suggestions": [
    {
      "kind": "activity" | "objective",
      "area": "kvalitet" | "miljo" | "arbetsmiljo" | "gemensamt",
      "title": "kort titel",
      "description": "vad som ska göras",
      "rationale": "varför – koppling till dokumentet och ISO-krav",
      "iso_clauses": ["9.2", "6.1"],
      "month": 1-12 (endast för activity),
      "activity_type": en av "revision","riskbedomning","ledningens_genomgang","utbildning","skyddsrond","lagbevakning","maluppfoljning","nodlagesovning","leverantorsutvardering","avvikelsehantering","medarbetarsamtal","inventering","policy" (endast för activity),
      "responsible_role": en av "VD","KMA-ansvarig","Skyddsombud","Platschef","Inköpsansvarig","Medarbetare",
      "checklist": ["delmoment 1", "delmoment 2"] (endast för activity),
      "unit": "enhet t.ex. %, ton CO2e, antal" (endast för objective),
      "baseline": tal eller null (endast för objective),
      "target": tal eller null (endast för objective)
    }
  ]
}

Ge 6–12 förslag totalt, varav minst 3 mål (objective). Föreslå inget som redan uppenbart är en dubblett.`;

type RawSuggestion = Record<string, unknown>;

const AREAS = ["kvalitet", "miljo", "arbetsmiljo", "gemensamt"];
const ACTIVITY_TYPES = [
  "revision",
  "riskbedomning",
  "ledningens_genomgang",
  "utbildning",
  "skyddsrond",
  "lagbevakning",
  "maluppfoljning",
  "nodlagesovning",
  "leverantorsutvardering",
  "avvikelsehantering",
  "medarbetarsamtal",
  "inventering",
  "policy",
];

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export const analyzeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { documentId: string }) => {
    if (!input?.documentId) throw new Error("documentId saknas");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI är inte konfigurerat.");

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", data.documentId)
      .single();
    if (docError || !doc) throw new Error("Dokumentet hittades inte.");

    await supabase
      .from("documents")
      .update({ analysis_status: "analyseras" })
      .eq("id", doc.id);

    try {
      const file = await supabase.storage.from(BUCKET).download(doc.file_path);
      if (file.error || !file.data) throw new Error("Kunde inte läsa filen.");

      const buffer = new Uint8Array(await file.data.arrayBuffer());
      const isPdf = doc.mime_type === "application/pdf";
      const content = isPdf
        ? [
            { type: "text", text: `Analysera dokumentet "${doc.title}".` },
            {
              type: "file",
              file: {
                filename: doc.title,
                file_data: `data:application/pdf;base64,${toBase64(buffer)}`,
              },
            },
          ]
        : [
            {
              type: "text",
              text: `Analysera dokumentet "${doc.title}":\n\n${new TextDecoder().decode(buffer).slice(0, 120_000)}`,
            },
          ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.6-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content },
          ],
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        console.error("AI gateway error", response.status, detail);
        throw new Error(
          response.status === 429
            ? "AI-tjänsten är tillfälligt överbelastad. Försök igen om en stund."
            : "AI-analysen misslyckades.",
        );
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = payload.choices?.[0]?.message?.content ?? "";
      const jsonText = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      const start = jsonText.indexOf("{");
      const end = jsonText.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("AI-svaret kunde inte tolkas.");

      const parsed = JSON.parse(jsonText.slice(start, end + 1)) as {
        summary?: string;
        suggestions?: RawSuggestion[];
      };

      const rows = (parsed.suggestions ?? []).map((s) => {
        const kind = s["kind"] === "objective" ? "objective" : "activity";
        const area = AREAS.includes(String(s["area"])) ? String(s["area"]) : "gemensamt";
        const activityType = ACTIVITY_TYPES.includes(String(s["activity_type"]))
          ? String(s["activity_type"])
          : null;
        const month = num(s["month"]);
        const checklist = Array.isArray(s["checklist"])
          ? (s["checklist"] as unknown[]).filter((c) => typeof c === "string")
          : [];
        return {
          document_id: doc.id,
          kind,
          area,
          title: str(s["title"]) ?? "Namnlöst förslag",
          description: str(s["description"]),
          rationale: str(s["rationale"]),
          iso_clauses: Array.isArray(s["iso_clauses"])
            ? (s["iso_clauses"] as unknown[]).filter((c) => typeof c === "string").map(String)
            : [],
          month: kind === "activity" ? Math.min(12, Math.max(1, month ?? 1)) : null,
          activity_type: kind === "activity" ? (activityType ?? "policy") : null,
          responsible_role: str(s["responsible_role"]) ?? "KMA-ansvarig",
          checklist,
          unit: kind === "objective" ? str(s["unit"]) : null,
          baseline: kind === "objective" ? num(s["baseline"]) : null,
          target: kind === "objective" ? num(s["target"]) : null,
        };
      });

      if (rows.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from("ai_suggestions").insert(rows as any);
        if (error) throw new Error(error.message);
      }

      await supabase
        .from("documents")
        .update({
          analysis_status: "analyserad",
          analysis_summary: str(parsed.summary),
        })
        .eq("id", doc.id);

      return { count: rows.length, summary: str(parsed.summary) };
    } catch (error) {
      await supabase.from("documents").update({ analysis_status: "fel" }).eq("id", doc.id);
      throw error;
    }
  });
