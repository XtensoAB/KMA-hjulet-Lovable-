import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { CircleDot, ClipboardList, ShieldCheck, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KMA Ledningssystem – Årshjul för ISO 9001, 14001 & 45001" },
      {
        name: "description",
        content:
          "Webbaserat integrerat ledningssystem med interaktivt årshjul, månadsagenda, avvikelsehantering och KPI-dashboard för full ISO-efterlevnad.",
      },
      {
        property: "og:title",
        content: "KMA Ledningssystem – Årshjul för ISO 9001, 14001 & 45001",
      },
      {
        property: "og:description",
        content:
          "Ersätt Excel-arken: planera, följ upp och dokumentera kvalitet, miljö och arbetsmiljö på ett ställe.",
      },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

const features = [
  {
    icon: CircleDot,
    title: "Interaktivt årshjul",
    text: "12 månader, 4 kvartal och separata ringar för kvalitet, miljö och arbetsmiljö.",
  },
  {
    icon: ClipboardList,
    title: "Månadsagenda",
    text: "Zooma in på månaden med checklistor, ansvarig roll, deadline och ISO-krav.",
  },
  {
    icon: TriangleAlert,
    title: "Avvikelser & tillbud",
    text: "Logga avvikelser direkt kopplat till månadens moment och följ åtgärder till stängning.",
  },
  {
    icon: ShieldCheck,
    title: "KPI:er & rapportunderlag",
    text: "Genomförda aktiviteter i tid, öppna avvikelser och export till ledningens genomgång.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-sidebar px-6 py-5 text-sidebar-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="font-display text-lg font-semibold">KMA Ledningssystem</p>
          <Link to="/auth">
            <Button size="sm" variant="secondary">
              Logga in
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          ISO 9001 · ISO 14001 · ISO 45001
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          Ett årshjul som håller ledningssystemet levande
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Planera, genomför och dokumentera lagstadgade krav, ISO-krav och interna rutiner med
          tydlig ansvarsfördelning – i stället för spridda Excel-ark.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/auth">
            <Button size="lg">Kom igång</Button>
          </Link>
          <Link to="/auth">
            <Button size="lg" variant="outline">
              Se årshjulet
            </Button>
          </Link>
        </div>

        <section className="mt-16 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 shadow-panel"
            >
              <f.icon className="size-5 text-primary" />
              <h2 className="mt-3 text-base font-semibold text-foreground">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
