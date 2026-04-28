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
import { createDeal, updateDeal } from "@/app/actions/crm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Deal, DealStage } from "@/types/database";
import { currencySymbol } from "@/lib/money";
import { normalizeWorkspaceCurrency } from "@/lib/currency";

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
  defaultCurrency: string;
  initialDeal?: Deal | null;
};

export function AddDealModal({
  open,
  onOpenChange,
  defaultStage,
  defaultCurrency,
  initialDeal = null,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<DealStage>(defaultStage);
  const [title, setTitle] = useState("");
  const [valueMajor, setValueMajor] = useState("");
  const curCode = normalizeWorkspaceCurrency(initialDeal?.currency ?? defaultCurrency);

  const isEdit = Boolean(initialDeal?.id);

  useEffect(() => {
    if (!open) return;
    setStage(initialDeal?.stage ?? defaultStage);
    if (initialDeal) {
      setTitle(initialDeal.title);
      setValueMajor((initialDeal.value_cents / 100).toFixed(2));
    } else {
      setTitle("");
      setValueMajor("");
    }
  }, [open, initialDeal, defaultStage]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-neutral-200 bg-white" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">
            {isEdit ? "Edit deal" : "Add deal"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Adjust value or stage — drag on the board still works." : "Track a brand partnership."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const trimmed = title.trim();
            const dollars = valueMajor.replace(/[$,\s]/g, "");
            const v = Math.max(0, Math.round((Number(dollars) || 0) * 100));
            if (!trimmed) {
              toast.error("Enter a deal name");
              return;
            }
            setLoading(true);
            try {
              if (isEdit && initialDeal) {
                await updateDeal(initialDeal.id, {
                  title: trimmed,
                  value_cents: v,
                  stage,
                });
                toast.success("Deal updated");
              } else {
                await createDeal({ title: trimmed, valueCents: v, stage, currency: curCode });
                toast.success("Deal created");
              }
              onOpenChange(false);
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to save deal");
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lumina Skincare"
              className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deal-value">Value ({curCode})</Label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-neutral-500">
                {currencySymbol(curCode)}
              </span>
              <Input
                id="deal-value"
                name="value"
                type="text"
                inputMode="decimal"
                value={valueMajor}
                onChange={(e) => setValueMajor(e.target.value)}
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
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create deal"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
