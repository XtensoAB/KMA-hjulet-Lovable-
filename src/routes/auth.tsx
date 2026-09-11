import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Logga in – KMA Ledningssystem" },
      {
        name: "description",
        content:
          "Logga in i det integrerade ledningssystemet för ISO 9001, ISO 14001 och ISO 45001.",
      },
      { property: "og:title", content: "Logga in – KMA Ledningssystem" },
      {
        property: "og:description",
        content: "Åtkomst till årshjul, månadsagenda och avvikelsehantering.",
      },
    ],
  }),
  component: AuthPage,
});

type AuthMode = "signin" | "signup" | "reset";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Konto skapat. Kontrollera din e-post om bekräftelse krävs.");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setResetSent(true);
        toast.success("E-post för lösenordsåterställning har skickats.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Inloggning misslyckades");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google-inloggning misslyckades");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  const title =
    mode === "signin" ? "Logga in" : mode === "signup" ? "Skapa konto" : "Återställ lösenord";

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          ISO 9001 · 14001 · 45001
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "reset"
            ? "Ange din e-postadress så skickar vi en återställningslänk."
            : "Integrerat ledningssystem med årshjul och månadsagenda."}
        </p>

        {mode === "reset" && resetSent ? (
          <div className="mt-6 rounded-lg border border-border bg-secondary p-4 text-sm text-foreground">
            <p>
              Om det finns ett konto för <span className="font-medium">{email}</span> har vi skickat
              en återställningslänk. Kontrollera din inkorg och skräppost.
            </p>
            <button
              className="mt-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => {
                setMode("signin");
                setResetSent(false);
              }}
            >
              Tillbaka till inloggning
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {mode !== "reset" && (
              <div className="space-y-2">
                <Label htmlFor="password">Lösenord</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
                {mode === "signin" && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      onClick={() => setMode("reset")}
                    >
                      Glömt lösenord?
                    </button>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {mode === "signin"
                ? "Logga in"
                : mode === "signup"
                  ? "Skapa konto"
                  : "Skicka återställningslänk"}
            </Button>
          </form>
        )}

        {mode !== "reset" && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> eller{" "}
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogle}>
              Fortsätt med Google
            </Button>
          </>
        )}

        {!resetSent && (
          <button
            className="mt-6 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setResetSent(false);
            }}
          >
            {mode === "signin"
              ? "Har du inget konto? Skapa konto"
              : mode === "signup"
                ? "Har du redan ett konto? Logga in"
                : "Har du redan ett konto? Logga in"}
          </button>
        )}
      </div>
    </div>
  );
}
