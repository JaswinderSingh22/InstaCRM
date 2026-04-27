"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createDeal } from "@/app/actions/crm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { DealStage } from "@/types/database";

const STAGE_OPTIONS: { id: DealStage; label: string }[] = [
  { id: "lead", label: "New inquiry" },
  { id: "qualified", label: "Qualified" },
  { id: "proposal", label: "Proposal sent" },
  { id: "negotiation", label: "Negotiating" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStage: DealStage;
};

export function AddDealModal({ open, onOpenChange, defaultStage }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<DealStage>(defaultStage);

  useEffect(() => {
    if (open) {
      setStage(defaultStage);
    }
  }, [open, defaultStage]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-neutral-200 bg-white" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">Add deal</DialogTitle>
          <DialogDescription>Track a new brand partnership or campaign.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const title = String(fd.get("title") ?? "").trim();
            const dollars = String(fd.get("value") ?? "").replace(/[$,\s]/g, "");
            const v = Math.max(0, Math.round((Number(dollars) || 0) * 100));
            if (!title) {
              toast.error("Enter a deal name");
              return;
            }
            setLoading(true);
            try {
              await createDeal({ title, valueCents: v, stage });
              toast.success("Deal created");
              onOpenChange(false);
              router.refresh();
              (e.target as HTMLFormElement).reset();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to create deal");
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="deal-title">Deal / brand name</Label>
            <Input
              id="deal-title"
              name="title"
              required
              placeholder="e.g. Lumina Skincare"
              className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deal-value">Value (USD)</Label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-neutral-500">$</span>
              <Input
                id="deal-value"
                name="value"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC] pl-7"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deal-stage">Stage</Label>
            <select
              id="deal-stage"
              name="stage"
              value={stage}
              onChange={(e) => setStage(e.target.value as DealStage)}
              className="flex h-10 w-full rounded-lg border border-neutral-200 bg-[#F8F9FC] px-3 text-sm"
            >
              {STAGE_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#4F46E5] to-indigo-600 text-white"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Create deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
