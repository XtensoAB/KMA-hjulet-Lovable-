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
  CHANNELS,
  COMM_STATUS_LABEL,
  CONTENT_BANK,
  type CommStatus,
  type Stakeholder,
} from "@/lib/business";
import { ROLES } from "@/lib/kma";

export function CommunicationDialog({
  open,
  onClose,
  stakeholders,
  defaultStakeholderId,
}: {
  open: boolean;
  onClose: () => void;
  stakeholders: Stakeholder[];
  defaultStakeholderId?: string | null;
}) {
  const queryClient = useQueryClient();
  const [stakeholderId, setStakeholderId] = useState("");
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [message, setMessage] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [status, setStatus] = useState<CommStatus>("planerad");
  const [role, setRole] = useState("VD");

  useEffect(() => {
    if (open) {
      setStakeholderId(defaultStakeholderId ?? stakeholders[0]?.id ?? "");
      setTitle("");
      setChannel(CHANNELS[0]);
      setMessage("");
      setPlannedDate("");
      setStatus("planerad");
      setRole("VD");
    }
  }, [open, defaultStakeholderId, stakeholders]);

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("communication_logs").insert({
        stakeholder_id: stakeholderId || null,
        title,
        channel,
        message: message || null,
        planned_date: plannedDate || null,
        status,
        performed_at: status === "genomford" ? new Date().toISOString() : null,
        responsible_role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communication_logs"] });
      toast.success("Kommunikationsaktiviteten sparad");
      onClose();
    },
    onError: () => toast.error("Kunde inte spara"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kommunikationsaktivitet</DialogTitle>
          <DialogDescription>Planera eller logga vad vi kommunicerat och till vem</DialogDescription>
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
              <Label htmlFor="cl-sh">Intressent</Label>
              <select
                id="cl-sh"
                value={stakeholderId}
                onChange={(e) => setStakeholderId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {stakeholders.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cl-channel">Hur (kanal)</Label>
              <select
                id="cl-channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cl-title">Vad (budskap)</Label>
            <Input
              id="cl-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. Vi har vunnit nytt avtal"
              list="cl-content-bank"
            />
            <datalist id="cl-content-bank">
              {CONTENT_BANK.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cl-msg">Anteckning / innehåll</Label>
            <Textarea
              id="cl-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cl-date">När</Label>
              <Input
                id="cl-date"
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cl-status">Status</Label>
              <select
                id="cl-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as CommStatus)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {(["planerad", "genomford", "installd"] as const).map((s) => (
                  <option key={s} value={s}>
                    {COMM_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cl-role">Ansvarig</Label>
              <select
                id="cl-role"
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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Spara
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
