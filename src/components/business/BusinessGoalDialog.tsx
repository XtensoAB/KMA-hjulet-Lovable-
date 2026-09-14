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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { ROLES } from "@/lib/kma";
import { CURRENT_YEAR } from "@/lib/kma-queries";

export function BusinessGoalDialog({
  open,
  onClose,
  year = CURRENT_YEAR,
}: {
  open: boolean;
  onClose: () => void;
  year?: number;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("VD");
  const [unit, setUnit] = useState("");
  const [baseline, setBaseline] = useState("");
  const [target, setTarget] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setRole("VD");
      setUnit("");
      setBaseline("");
      setTarget("");
    }
  }, [open]);

  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("business_goals").insert({
        year,
        title,
        description: description || null,
        responsible_role: role,
        unit: unit || null,
        baseline: num(baseline),
        target: num(target),
        current_value: num(baseline),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_goals"] });
      toast.success("Bolagsmålet skapat");
      onClose();
    },
    onError: () => toast.error("Kunde inte spara målet"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nytt bolagsmål</DialogTitle>
          <DialogDescription>Övergripande mål för verksamhetsår {year}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="bg-title">Mål</Label>
            <Input
              id="bg-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. Öka andelen ramavtalskunder"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bg-desc">Beskrivning</Label>
            <Textarea
              id="bg-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bg-role">Ansvarig</Label>
              <select
                id="bg-role"
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
            <div className="space-y-2">
              <Label htmlFor="bg-unit">Enhet</Label>
              <Input
                id="bg-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="st, %, MSEK"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bg-base">Utgångsvärde</Label>
              <Input
                id="bg-base"
                type="number"
                step="any"
                value={baseline}
                onChange={(e) => setBaseline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bg-target">Målvärde</Label>
              <Input
                id="bg-target"
                type="number"
                step="any"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Spara mål
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
