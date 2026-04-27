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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBrandContact, createRelationshipEvent } from "@/app/actions/crm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { BrandActivityKind } from "@/types/database";

const KIND_OPTIONS: { id: BrandActivityKind; label: string }[] = [
  { id: "note", label: "Note" },
  { id: "email", label: "Email" },
  { id: "meeting", label: "Meeting" },
  { id: "contract", label: "Contract" },
  { id: "payment", label: "Payment" },
];

type BrandOption = { id: string; name: string };

type ActivityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brands: BrandOption[];
  initialBrandId?: string | null;
};

export function AddRelationshipEventDialog({
  open,
  onOpenChange,
  brands,
  initialBrandId,
}: ActivityDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [brandId, setBrandId] = useState<string>("");
  const [kind, setKind] = useState<BrandActivityKind>("note");

  useEffect(() => {
    if (!open) return;
    const first = brands[0]?.id ?? "";
    setBrandId(initialBrandId && brands.some((b) => b.id === initialBrandId) ? initialBrandId : first);
    setKind("note");
  }, [open, brands, initialBrandId]);

  if (brands.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-neutral-200 bg-white" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">Add timeline event</DialogTitle>
          <DialogDescription>
            Log a note, email, meeting, or payment for a brand partnership.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const title = String(fd.get("title") ?? "").trim();
            const body = String(fd.get("body") ?? "").trim();
            if (!title) {
              toast.error("Title is required");
              return;
            }
            if (!brandId) {
              toast.error("Select a brand");
              return;
            }
            let amountCents: number | null = null;
            if (kind === "payment") {
              const raw = String(fd.get("amount") ?? "").replace(/[$,\s]/g, "");
              const n = Math.round((Number(raw) || 0) * 100);
              amountCents = n > 0 ? n : null;
            }
            setLoading(true);
            try {
              await createRelationshipEvent({
                brandId,
                kind,
                title,
                body: body || null,
                amountCents: kind === "payment" ? amountCents : null,
              });
              toast.success("Event added");
              onOpenChange(false);
              router.refresh();
              (e.target as HTMLFormElement).reset();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to save");
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="space-y-2">
            <Label>Brand</Label>
            <Select
              value={brandId}
              onValueChange={(v) => {
                if (v) setBrandId(v);
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as BrandActivityKind)}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KIND_OPTIONS.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-title">Title</Label>
            <Input
              id="ev-title"
              name="title"
              required
              placeholder="e.g. Follow-up call"
              className="h-10 rounded-lg border-neutral-200"
            />
          </div>
          {kind === "payment" && (
            <div className="space-y-2">
              <Label htmlFor="ev-amount">Amount (USD)</Label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-neutral-500">$</span>
                <Input
                  id="ev-amount"
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="h-10 pl-7"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="ev-body">Details (optional)</Label>
            <Textarea
              id="ev-body"
              name="body"
              rows={3}
              placeholder="Context for your team…"
              className="resize-none rounded-lg border-neutral-200"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#4F46E5] to-indigo-600 text-white"
            >
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brands: BrandOption[];
  initialBrandId?: string | null;
};

export function AddPartnerContactDialog({ open, onOpenChange, brands, initialBrandId }: ContactDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [brandId, setBrandId] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    const first = brands[0]?.id ?? "";
    setBrandId(initialBrandId && brands.some((b) => b.id === initialBrandId) ? initialBrandId : first);
  }, [open, brands, initialBrandId]);

  if (brands.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-neutral-200 bg-white" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">Add contact</DialogTitle>
          <DialogDescription>Add someone from the partner’s team to your directory.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = String(fd.get("name") ?? "").trim();
            if (!name || !brandId) {
              toast.error("Name and brand are required");
              return;
            }
            setLoading(true);
            try {
              await createBrandContact({
                brandId,
                name,
                email: String(fd.get("email") ?? "").trim() || null,
                role: String(fd.get("role") ?? "").trim() || null,
              });
              toast.success("Contact added");
              onOpenChange(false);
              router.refresh();
              (e.target as HTMLFormElement).reset();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to save");
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="space-y-2">
            <Label>Brand</Label>
            <Select
              value={brandId}
              onValueChange={(v) => {
                if (v) setBrandId(v);
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" name="name" required className="h-10" placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-email">Email</Label>
            <Input id="c-email" name="email" type="email" className="h-10" placeholder="name@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-role">Role</Label>
            <Input id="c-role" name="role" className="h-10" placeholder="e.g. Marketing lead" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#4F46E5] to-indigo-600 text-white"
            >
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Add contact
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
