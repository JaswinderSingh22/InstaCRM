"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPayment, deletePayment, updatePayment } from "@/app/actions/crm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Payment } from "@/types/database";
import { formatMoney } from "@/lib/money";
import { normalizeWorkspaceCurrency } from "@/lib/currency";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PaymentForm({ defaultCurrency }: { defaultCurrency: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button
        id="create-invoice-btn"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 gap-1.5 rounded-lg border-0 bg-gradient-to-r from-[#4F46E5] to-indigo-600 font-semibold text-white shadow-sm hover:from-[#4338ca] hover:to-indigo-600"
      >
        + Create invoice
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-neutral-200 bg-white" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-900">Create invoice</DialogTitle>
            <DialogDescription>
              Track expected revenue from brands. Mark paid when money lands — this is separate from Stripe subscription
              billing.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const cents = Math.max(0, Math.floor(Number(fd.get("amount") || 0) * 100));
              const due = fd.get("due");
              setLoading(true);
              try {
                await createPayment({
                  clientName: String(fd.get("client")),
                  amountCents: cents,
                  status: (fd.get("status") as Payment["status"]) || "pending",
                  dueDate: due ? String(due) : null,
                  description: String(fd.get("desc") || "") || null,
                  currency: normalizeWorkspaceCurrency(defaultCurrency),
                });
                setOpen(false);
                toast.success("Saved");
                router.refresh();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Error");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="pay-client">Brand / client *</Label>
              <Input
                id="pay-client"
                name="client"
                required
                placeholder="e.g. GlowSkin Organics"
                className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pay-amount">Amount ({normalizeWorkspaceCurrency(defaultCurrency)})</Label>
                <Input
                  id="pay-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay-due">Due</Label>
                <Input id="pay-due" name="due" type="date" className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-status">Status</Label>
              <select
                id="pay-status"
                name="status"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-[#F8F9FC] px-3 text-sm"
                defaultValue="pending"
              >
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="overdue">overdue</option>
                <option value="canceled">canceled</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-desc">Deal / campaign</Label>
              <Input
                id="pay-desc"
                name="desc"
                placeholder="e.g. Summer Skincare Series (3 Reels)"
                className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
              />
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="font-semibold">
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PaymentsTable({ rows }: { rows: Payment[] }) {
  const router = useRouter();
  return (
    <div className="overflow-x-auto rounded-md border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.client_name}</TableCell>
              <TableCell>{formatMoney(p.amount_cents, p.currency)}</TableCell>
              <TableCell>
                <select
                  className="rounded border border-border/60 bg-background px-1 text-xs disabled:opacity-60"
                  value={p.status}
                  disabled={p.status === "paid"}
                  onChange={async (e) => {
                    const status = e.target.value as Payment["status"];
                    try {
                      await updatePayment(p.id, {
                        status,
                        paid_at: status === "paid" ? new Date().toISOString() : null,
                      });
                      router.refresh();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Error");
                    }
                  }}
                >
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                  <option value="overdue">overdue</option>
                  <option value="canceled">canceled</option>
                </select>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {p.due_date || "—"}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-destructive"
                  onClick={async () => {
                    if (!confirm("Delete?")) return;
                    try {
                      await deletePayment(p.id);
                      router.refresh();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Error");
                    }
                  }}
                >
                  Del
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
