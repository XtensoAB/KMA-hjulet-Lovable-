import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  EFFORT_LABEL,
  IMPORTANCE_LABEL,
  KIND_LABEL,
  type Effort,
  type GoalItemKind,
  type Importance,
} from "@/lib/business";
import { ROLES } from "@/lib/kma";

export function GoalItemDialog({
  open,
  onClose,
  goalId,
  goalTitle,
}: {
  open: boolean;
  onClose: () => void;
  goalId: string | null;
  goalTitle?: string;
}) {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<GoalItemKind>("aktivitet");
  const [title, setTitle] = useState("");
  const [importance, setImportance] = useState<Importance>("viktig");
  const [effort, setEffort] = useState<Effort>("latt");
  const [role, setRole] = useState("VD");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (open) {
      setKind("aktivitet");
      setTitle("");
      setImportance("viktig");
      setEffort("latt");
      setRole("VD");
      setDueDate("");
    }
  }, [open]);

  const create = useMutation({
    mutationFn: async () => {
      if (!goalId) throw new Error("no goal");
      const { error } = await supabase.from("business_goal_items").insert({
        goal_id: goalId,
        kind,
        title,
        importance,
        effort,
        responsible_role: role,
        due_date: dueDate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_goal_items"] });
      toast.success("Sparat");
      onClose();
    },
    onError: () => toast.error("Kunde inte spara"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nytt delmål / aktivitet</DialogTitle>
          <DialogDescription>{goalTitle ? `Kopplas till: ${goalTitle}` : ""}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gi-kind">Typ</Label>
              <select
                id="gi-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as GoalItemKind)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {(["delmal", "aktivitet"] as const).map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gi-role">Ansvarig</Label>
              <select
                id="gi-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gi-title">Benämning</Label>
            <Input
              id="gi-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. Genomföra 10 kundmöten per kvartal"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gi-imp">Prioritering</Label>
              <select
                id="gi-imp"
                value={importance}
                onChange={(e) => setImportance(e.target.value as Importance)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {(["viktig", "mindre_viktig"] as const).map((i) => (
                  <option key={i} value={i}>
                    {IMPORTANCE_LABEL[i]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gi-eff">Genomförande</Label>
              <select
                id="gi-eff"
                value={effort}
                onChange={(e) => setEffort(e.target.value as Effort)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {(["latt", "svar"] as const).map((f) => (
                  <option key={f} value={f}>
                    {EFFORT_LABEL[f]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gi-due">Klart senast</Label>
            <Input
              id="gi-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button type="submit" disabled={create.isPending || !goalId}>
              Spara
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
