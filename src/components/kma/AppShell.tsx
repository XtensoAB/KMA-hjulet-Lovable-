import { Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  CircleDot,
  LayoutDashboard,
  LogOut,
  Target,
  TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CURRENT_YEAR } from "@/lib/kma-queries";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/arshjul", label: "Årshjul", icon: CircleDot },
  { to: "/avvikelser", label: "Avvikelser", icon: TriangleAlert },
  { to: "/mal", label: "KMA-mål", icon: Target },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar px-4 py-6 text-sidebar-foreground md:flex">
        <div className="px-2">
          <p className="font-display text-lg font-semibold leading-tight">Ledningssystem</p>
          <p className="mt-1 text-xs text-sidebar-foreground/70">
            ISO 9001 · 14001 · 45001
          </p>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
              }}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
          <Link
            to="/manad/$month"
            params={{ month: String(new Date().getMonth() + 1) }}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <CalendarDays className="size-4" />
            Månadsagenda
          </Link>
        </nav>

        <div className="mt-6 space-y-3 px-1">
          <p className="text-xs text-sidebar-foreground/60">Verksamhetsår {CURRENT_YEAR}</p>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" /> Logga ut
          </button>
        </div>
      </aside>

      <main className="flex-1">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border bg-card px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <Button variant="outline" size="sm" className="md:hidden" onClick={signOut}>
              Logga ut
            </Button>
          </div>
        </header>
        <div className="px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
