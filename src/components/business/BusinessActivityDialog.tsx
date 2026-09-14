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
import { CATEGORY_LABEL, CATEGORY_ORDER, type BusinessCategory } from "@/lib/business";
import { MONTHS, ROLES } from "@/lib/kma";
import { CURRENT_YEAR } from "@/lib/kma-queries";

export function BusinessActivityDialog({
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
  const [category, setCategory] = useState<BusinessCategory>("personal");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [role, setRole] = useState("VD");
  const [recurring, setRecurring] = useState(true);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setCategory("personal");
      setMonth(new Date().getMonth() + 1);
      setRole("VD");
      setRecurring(true);
    }
  }, [open]);

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("business_activities").insert({
        year,
        month,
        category,
        title,
        description: description || null,
        responsible_role: role,
        recurring,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_activities"] });
      toast.success("Aktiviteten tillagd i årshjulet");
      onClose();
    },
    onError: () => toast.error("Kunde inte spara aktiviteten"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ny bolagsaktivitet</DialogTitle>
          <DialogDescription>Återkommande aktivitet i bolagets årshjul {year}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="ba-title">Aktivitet</Label>
            <Input
              id="ba-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. Medarbetarsamtal, Styrelsemöte, Kundträff"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ba-cat">Kategori</Label>
              <select
                id="ba-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ba-month">Månad</Label>
              <select
                id="ba-month"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ba-role">Ansvarig</Label>
              <select
                id="ba-role"
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
            <label className="flex items-end gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="mb-2.5 size-4"
              />
              <span className="mb-2">Återkommande varje år</span>
            </label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ba-desc">Beskrivning</Label>
            <Textarea
              id="ba-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Spara aktivitet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
