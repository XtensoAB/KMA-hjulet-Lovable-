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
import type { Stakeholder } from "@/lib/business";

export function StakeholderDialog({
  open,
  onClose,
  stakeholder,
  nextOrder = 0,
}: {
  open: boolean;
  onClose: () => void;
  stakeholder?: Stakeholder | null;
  nextOrder?: number;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [need, setNeed] = useState("");
  const [how, setHow] = useState("");
  const [what, setWhat] = useState("");

  useEffect(() => {
    if (open) {
      setName(stakeholder?.name ?? "");
      setNeed(stakeholder?.interaction_need ?? "");
      setHow(stakeholder?.how_to_communicate ?? "");
      setWhat(stakeholder?.what_to_communicate ?? "");
    }
  }, [open, stakeholder]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        interaction_need: need || null,
        how_to_communicate: how || null,
        what_to_communicate: what || null,
      };
      if (stakeholder) {
        const { error } = await supabase
          .from("stakeholders")
          .update(payload)
          .eq("id", stakeholder.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("stakeholders")
          .insert({ ...payload, sort_order: nextOrder });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholders"] });
      toast.success("Intressenten sparad");
      onClose();
    },
    onError: () => toast.error("Kunde inte spara intressenten"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{stakeholder ? "Redigera intressent" : "Ny intressent"}</DialogTitle>
          <DialogDescription>Vad behövs, hur och vad kommunicerar vi</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="sh-name">Intressent</Label>
            <Input id="sh-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sh-need">Mer interaktion behövs kring</Label>
            <Textarea id="sh-need" rows={2} value={need} onChange={(e) => setNeed(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sh-how">Hur kommunicera</Label>
            <Textarea id="sh-how" rows={2} value={how} onChange={(e) => setHow(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sh-what">Vad kommunicera</Label>
            <Textarea id="sh-what" rows={2} value={what} onChange={(e) => setWhat(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button type="submit" disabled={save.isPending}>
              Spara
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
