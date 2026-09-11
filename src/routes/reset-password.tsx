import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Återställ lösenord – KMA Ledningssystem" },
      {
        name: "description",
        content:
          "Ange ett nytt lösenord för ditt konto i KMA-ledningssystemet.",
      },
      { property: "og:title", content: "Återställ lösenord – KMA Ledningssystem" },
      {
        property: "og:description",
        content: "Sätt ett nytt lösenord för åtkomst till årshjul och agenda.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

type Status = "idle" | "recovering" | "ready" | "success" | "error";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function recoverSession() {
      setStatus("recovering");

      // Supabase may already have consumed the recovery hash and set the session.
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        if (!cancelled) setStatus("ready");
        return;
      }

      // Fallback: parse the hash manually and set the session.
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (type !== "recovery" || !accessToken || !refreshToken) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            "Länken är ogiltig eller har gått ut. Begär en ny återställningslänk."
          );
        }
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(error.message);
        }
        return;
      }

      if (!cancelled) setStatus("ready");
    }

    recoverSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Lösenorden matchar inte.");
      return;
    }

    if (password.length < 6) {
      toast.error("Lösenordet måste vara minst 6 tecken.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus("success");
      toast.success("Lösenordet har uppdaterats.");
      setTimeout(() => navigate({ to: "/dashboard" }), 1500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunde inte uppdatera lösenordet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          ISO 9001 · 14001 · 45001
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Återställ lösenord</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ange ett nytt lösenord för ditt konto.
        </p>

        {status === "error" && (
          <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <p>{errorMessage}</p>
            <Link
              to="/auth"
              className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Tillbaka till inloggning
            </Link>
          </div>
        )}

        {(status === "ready" || status === "success") && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nytt lösenord</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || status === "success"}>
              {status === "success" ? "Lösenord uppdaterat" : "Spara nytt lösenord"}
            </Button>
          </form>
        )}

        {status === "recovering" && (
          <div className="mt-6 text-sm text-muted-foreground">Verifierar återställningslänk…</div>
        )}
      </div>
    </div>
  );
}
