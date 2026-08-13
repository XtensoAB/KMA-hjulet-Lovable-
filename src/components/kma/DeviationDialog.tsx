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
import {
  AREA_ORDER,
  AREA_SHORT,
  DEVIATION_TYPE_LABEL,
  ROLES,
  type Activity,
  type Area,
  type DeviationType,
} from "@/lib/kma";

export function DeviationDialog({
  activity,
  open,
  onClose,
}: {
  activity: Activity | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DeviationType>("avvikelse");
  const [area, setArea] = useState<Area>("gemensamt");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [role, setRole] = useState("KMA-ansvarig");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setLocation("");
      setSeverity("medium");
      setDueDate("");
      setArea(activity?.area ?? "gemensamt");
      setRole(activity?.responsible_role ?? "KMA-ansvarig");
    }
  }, [open, activity]);

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("deviations").insert({
        title,
        type,
        area,
        description: description || null,
        location: location || null,
        severity,
        responsible_role: role,
        due_date: dueDate || null,
        activity_id: activity?.id ?? null,
        reported_by: userData.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deviations"] });
      toast.success("Avvikelsen registrerad");
      onClose();
    },
    onError: () => toast.error("Kunde inte registrera avvikelsen"),
  });

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrera avvikelse, tillbud eller förslag</DialogTitle>
          <DialogDescription>
            {activity ? `Kopplas till: ${activity.title}` : "Fristående registrering"}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="dev-title">Rubrik</Label>
            <Input
              id="dev-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dev-type">Typ</Label>
              <select
                id="dev-type"
                value={type}
                onChange={(e) => setType(e.target.value as DeviationType)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {Object.entries(DEVIATION_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-area">ISO-område</Label>
              <select
                id="dev-area"
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="dev-desc">Beskrivning</Label>
            <Textarea
              id="dev-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dev-loc">Plats</Label>
              <Input id="dev-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-sev">Allvarlighet</Label>
              <select
                id="dev-sev"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="low">Låg</option>
                <option value="medium">Medel</option>
                <option value="high">Hög</option>
                <option value="critical">Kritisk</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-role">Ansvarig roll</Label>
              <select
                id="dev-role"
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
              <Label htmlFor="dev-due">Åtgärd senast</Label>
              <Input
                id="dev-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Registrera
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
