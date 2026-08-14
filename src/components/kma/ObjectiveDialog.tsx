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
import { AREA_ORDER, AREA_SHORT, ROLES, type Area } from "@/lib/kma";
import { CURRENT_YEAR } from "@/lib/kma-queries";

export function ObjectiveDialog({
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
  const [area, setArea] = useState<Area>("kvalitet");
  const [unit, setUnit] = useState("");
  const [baseline, setBaseline] = useState("");
  const [target, setTarget] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [role, setRole] = useState("KMA-ansvarig");

  useEffect(() => {
    if (open) {
      setTitle("");
      setArea("kvalitet");
      setUnit("");
      setBaseline("");
      setTarget("");
      setCurrentValue("");
      setRole("KMA-ansvarig");
    }
  }, [open]);

  const num = (value: string) => (value.trim() === "" ? null : Number(value));

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("objectives").insert({
        year,
        area,
        title,
        unit: unit || null,
        baseline: num(baseline),
        target: num(target),
        current_value: num(currentValue) ?? num(baseline),
        responsible_role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      toast.success("KMA-målet skapat");
      onClose();
    },
    onError: () => toast.error("Kunde inte skapa målet"),
  });

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nytt KMA-mål</DialogTitle>
          <DialogDescription>Mätbart mål för verksamhetsår {year}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="obj-title">Målformulering</Label>
            <Input
              id="obj-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. Minska antalet tillbud på arbetsplatsen"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="obj-area">ISO-område</Label>
              <select
                id="obj-area"
                value={area}
                onChange={(e) => setArea(e.target.value as Area)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {AREA_ORDER.map((a) => (
                  <option key={a} value={a}>
                    {AREA_SHORT[a]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="obj-role">Ansvarig roll</Label>
              <select
                id="obj-role"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="obj-unit">Enhet</Label>
              <Input
                id="obj-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="st, %, ton CO2e"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obj-baseline">Utgångsvärde</Label>
              <Input
                id="obj-baseline"
                type="number"
                step="any"
                value={baseline}
                onChange={(e) => setBaseline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obj-current">Nuvärde</Label>
              <Input
                id="obj-current"
                type="number"
                step="any"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obj-target">Målvärde</Label>
              <Input
                id="obj-target"
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
