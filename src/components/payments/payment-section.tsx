"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPayment, deletePayment, updatePayment } from "@/app/actions/crm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Payment } from "@/types/database";
import { formatMoney } from "@/lib/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PaymentForm() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  if (!open) {
    return (
      <Button
        id="create-invoice-btn"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 gap-1.5 rounded-lg border-0 bg-gradient-to-r from-[#4F46E5] to-indigo-600 font-semibold text-white shadow-sm hover:from-[#4338ca] hover:to-indigo-600"
      >
        + Create invoice
      </Button>
    );
  }
  return (
    <form
      className="mb-4 max-w-md space-y-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const cents = Math.max(0, Math.floor(Number(fd.get("amount") || 0) * 100));
        const due = fd.get("due");
        try {
          await createPayment({
            clientName: String(fd.get("client")),
            amountCents: cents,
            status: (fd.get("status") as Payment["status"]) || "pending",
            dueDate: due ? String(due) : null,
            description: String(fd.get("desc") || "") || null,
          });
          setOpen(false);
          toast.success("Saved");
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Error");
        }
      }}
    >
      <div className="space-y-1.5">
        <Label>Brand / client *</Label>
        <Input name="client" required placeholder="e.g. GlowSkin Organics" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label>Amount (USD)</Label>
          <Input name="amount" type="number" step="0.01" min="0" required />
        </div>
        <div>
          <Label>Due</Label>
          <Input name="due" type="date" />
        </div>
      </div>
      <div>
        <Label>Status</Label>
        <select
          name="status"
          className="h-9 w-full rounded border border-border bg-background px-2 text-sm"
          defaultValue="pending"
        >
          <option value="pending">pending</option>
          <option value="paid">paid</option>
          <option value="overdue">overdue</option>
          <option value="canceled">canceled</option>
        </select>
      </div>
      <div>
        <Label>Deal / campaign</Label>
        <Input name="desc" placeholder="e.g. Summer Skincare Series (3 Reels)" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
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
                  className="rounded border border-border/60 bg-background px-1 text-xs"
                  value={p.status}
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
