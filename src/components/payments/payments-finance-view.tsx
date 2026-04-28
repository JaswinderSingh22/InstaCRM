"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  format,
  isAfter,
  isWithinInterval,
  parseISO,
  startOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Pencil,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { updatePayment } from "@/app/actions/crm";
import { formatMajorUnitsAmount, formatMajorUnitsCompact, formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Payment, PaymentStatus } from "@/types/database";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageFade } from "@/components/layout/page-fade";
import { PaymentForm } from "@/components/payments/payment-section";

type Props = {
  rows: Payment[];
  initialQuery?: string;
  workspaceDefaultCurrency: string;
};

const PAGE_SIZE = 4;

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const AVATAR_BG = [
  "bg-violet-100 text-violet-800",
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-900",
  "bg-emerald-100 text-emerald-800",
  "bg-rose-100 text-rose-800",
];

function BrandMark({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0]![0]! + parts[1]![0]!).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  const c = AVATAR_BG[hash(name) % AVATAR_BG.length]!;
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold",
        c,
      )}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<
    PaymentStatus,
    { label: string; className: string; icon?: React.ReactNode }
  > = {
    pending: {
      label: "PENDING",
      className: "border border-violet-200 bg-violet-50 text-violet-800",
    },
    paid: {
      label: "PAID",
      className: "border border-teal-200 bg-teal-50 text-teal-800",
      icon: <Check className="size-3" strokeWidth={2.5} />,
    },
    overdue: {
      label: "OVERDUE",
      className: "border border-rose-200 bg-rose-50 text-rose-800",
    },
    canceled: {
      label: "CANCELED",
      className: "border border-neutral-200 bg-neutral-100 text-neutral-600",
    },
  };
  const m = map[status] ?? map.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide",
        m.className,
      )}
    >
      {m.icon}
      {m.label}
    </span>
  );
}

function filterBySearch(rows: Payment[], q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter(
    (p) =>
      p.client_name.toLowerCase().includes(s) ||
      (p.description && p.description.toLowerCase().includes(s)) ||
      p.status.includes(s),
  );
}

function inLast30Days(p: Payment) {
  const ref = p.due_date
    ? parseISO(p.due_date)
    : p.created_at
      ? parseISO(p.created_at)
      : new Date(0);
  return isAfter(ref, startOfDay(subDays(new Date(), 30)));
}

function exportCsv(rows: Payment[]) {
  const header = "Brand,Deal,Amount,Currency,Due date,Status";
  const lines = rows.map((p) => {
    const deal = (p.description || "").replaceAll(",", ";");
    const amount = (p.amount_cents / 100).toFixed(2);
    const due = p.due_date || "";
    return [p.client_name, deal, amount, p.currency, due, p.status]
      .map((c) => `"${String(c).replaceAll('"', '""')}"`)
      .join(",");
  });
  const blob = new Blob([header + "\n" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `instacrm-payments-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function EditInvoiceDialog({
  payment,
  open,
  onOpenChange,
  defaultWorkspaceCurrency,
}: {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultWorkspaceCurrency: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState("");
  const [amountMajor, setAmountMajor] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("pending");

  useEffect(() => {
    if (!payment || !open) return;
    setClientName(payment.client_name);
    setAmountMajor((payment.amount_cents / 100).toFixed(2));
    setDueDate(payment.due_date ?? "");
    setDescription(payment.description ?? "");
    setStatus(payment.status);
  }, [payment, open]);

  const curCode = payment?.currency?.trim().toUpperCase() ?? defaultWorkspaceCurrency;

  if (!payment) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!payment || payment.status === "paid") return;
    const dollars = amountMajor.replace(/[$,\s]/g, "");
    const cents = Math.max(0, Math.round((Number(dollars) || 0) * 100));
    setLoading(true);
    try {
      await updatePayment(payment.id, {
        client_name: clientName.trim(),
        amount_cents: cents,
        due_date: dueDate ? dueDate : null,
        description: description.trim() ? description.trim() : null,
        status,
        paid_at: status === "paid" ? new Date().toISOString() : null,
      });
      toast.success("Invoice updated");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-neutral-200 bg-white" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">Edit invoice</DialogTitle>
          <DialogDescription>
            Changes apply to this workspace invoice. Currency: {curCode}.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="inv-client">Brand / client</Label>
            <Input
              id="inv-client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inv-amt">Amount ({curCode})</Label>
              <Input
                id="inv-amt"
                value={amountMajor}
                onChange={(e) => setAmountMajor(e.target.value)}
                inputMode="decimal"
                required
                className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-due">Due date</Label>
              <Input
                id="inv-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-desc">Deal / campaign</Label>
            <Textarea
              id="inv-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-lg border-neutral-200 bg-[#F8F9FC]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-st">Status</Label>
            <select
              id="inv-st"
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentStatus)}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-[#F8F9FC] px-3 text-sm"
            >
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="overdue">overdue</option>
              <option value="canceled">canceled</option>
            </select>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="font-semibold">
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PaymentsFinanceView({ rows, initialQuery = "", workspaceDefaultCurrency }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? initialQuery;
  const [page, setPage] = useState(0);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);

  const filtered = useMemo(() => filterBySearch(rows, q), [rows, q]);
  const recent = useMemo(() => {
    const r = filtered.filter(inLast30Days);
    return r.length > 0 ? r : filtered;
  }, [filtered]);

  const metrics = useMemo(() => {
    const overdueCents = filtered
      .filter((p) => p.status === "overdue")
      .reduce((a, p) => a + p.amount_cents, 0);
    const pendingCents = filtered
      .filter((p) => p.status === "pending")
      .reduce((a, p) => a + p.amount_cents, 0);
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const paidThisMonthCents = filtered
      .filter((p) => p.status === "paid")
      .filter((p) => {
        const at = p.paid_at ? parseISO(p.paid_at) : p.due_date ? parseISO(p.due_date) : null;
        if (!at) return false;
        return isWithinInterval(at, { start: monthStart, end: monthEnd });
      })
      .reduce((a, p) => a + p.amount_cents, 0);
    const paidThisMonthCount = filtered.filter(
      (p) =>
        p.status === "paid" &&
        (p.paid_at
          ? isWithinInterval(parseISO(p.paid_at), { start: monthStart, end: monthEnd })
          : false),
    ).length;
    return { overdueCents, pendingCents, paidThisMonthCents, paidThisMonthCount };
  }, [filtered]);

  const chartData = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const p of rows) {
      if (p.status !== "paid") continue;
      const t = p.paid_at
        ? parseISO(p.paid_at)
        : p.due_date
          ? parseISO(p.due_date)
          : p.updated_at
            ? parseISO(p.updated_at)
            : null;
      if (!t) continue;
      const key = format(t, "yyyy-MM");
      byMonth.set(key, (byMonth.get(key) ?? 0) + p.amount_cents);
    }
    const out: { name: string; monthKey: string; dollars: number; highlight: boolean }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(d, "yyyy-MM");
      const cents = byMonth.get(key) ?? 0;
      out.push({
        name: format(d, "MMM").toUpperCase(),
        monthKey: key,
        dollars: Math.round(cents / 100),
        highlight: i === 0,
      });
    }
    return out;
  }, [rows]);

  const onMarkPaid = useCallback(
    async (id: string) => {
      try {
        await updatePayment(id, { status: "paid", paid_at: new Date().toISOString() });
        toast.success("Marked paid");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Update failed");
      }
    },
    [router],
  );

  const pageCount = Math.max(1, Math.ceil(recent.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = page * PAGE_SIZE;
    return recent.slice(start, start + PAGE_SIZE);
  }, [recent, page]);

  return (
    <PageFade>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Finance overview</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Manage your earnings, brand deals, and pending invoices in one place.
            </p>
            {q.trim() && (
              <p className="mt-1 text-xs text-neutral-500">
                Filtered: “{q}” —{" "}
                <Link href="/payments" className="text-[#4F46E5] hover:underline">
                  clear
                </Link>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportCsv(filtered)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 gap-1.5 rounded-lg border-neutral-200",
              )}
            >
              <Download className="size-3.5" />
              Export CSV
            </button>
            <PaymentForm defaultCurrency={workspaceDefaultCurrency} />
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                OVERDUE PAYMENTS
              </span>
              <AlertTriangle className="size-4 text-rose-500" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-neutral-900">
              {formatMoney(metrics.overdueCents, workspaceDefaultCurrency)}
            </p>
            <p className="mt-0.5 text-xs text-rose-600">Review due dates in the table below</p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">
                PENDING PAYMENTS
              </span>
              <Clock className="size-4 text-violet-500" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-neutral-900">
              {formatMoney(metrics.pendingCents, workspaceDefaultCurrency)}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">Expected per due dates in list</p>
          </div>
          <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                PAID THIS MONTH
              </span>
              <CheckCircle2 className="size-4 text-teal-600" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-neutral-900">
              {formatMoney(metrics.paidThisMonthCents, workspaceDefaultCurrency)}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {metrics.paidThisMonthCount} payment{metrics.paidThisMonthCount === 1 ? "" : "s"}{" "}
              in this period
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/80 text-left text-xs font-bold tracking-wide text-neutral-500">
                  <th className="px-4 py-3">BRAND</th>
                  <th className="px-4 py-3">DEAL NAME</th>
                  <th className="px-4 py-3">AMOUNT</th>
                  <th className="px-4 py-3">DUE DATE</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                      No payments match {q.trim() ? "your search" : "this view"}.
                    </td>
                  </tr>
                ) : (
                  paged.map((p) => {
                    const due = p.due_date ? parseISO(p.due_date) : null;
                    const overdueLine =
                      p.status === "overdue" || (p.status === "pending" && due && due < new Date());
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-neutral-100 last:border-0 transition hover:bg-neutral-50/80"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <BrandMark name={p.client_name} />
                            <div>
                              <p className="font-semibold text-neutral-900">{p.client_name}</p>
                              <p className="text-xs text-neutral-500">Brand partner</p>
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[220px] px-4 py-3 text-neutral-700">
                          {p.description || "—"}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3 font-semibold tabular-nums",
                            p.status === "paid" ? "text-teal-700" : "text-neutral-900",
                          )}
                        >
                          {formatMoney(p.amount_cents, p.currency.toUpperCase())}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3 tabular-nums",
                            overdueLine ? "font-medium text-rose-600" : "text-neutral-600",
                          )}
                        >
                          {due ? format(due, "MMM dd, yyyy") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {p.status !== "paid" && p.status !== "canceled" ? (
                              <button
                                type="button"
                                onClick={() => setEditPayment(p)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-[#4F46E5]"
                              >
                                <Pencil className="size-3" />
                                Edit
                              </button>
                            ) : null}
                            {p.status === "paid" ? (
                              <span
                                className="inline-flex size-7 items-center justify-center rounded-full bg-teal-50 text-teal-700"
                                aria-label="Paid"
                              >
                                <Check className="size-4" />
                              </span>
                            ) : p.status === "canceled" ? null : (
                              <button
                                type="button"
                                onClick={() => onMarkPaid(p.id)}
                                className="text-xs font-semibold text-[#4F46E5] hover:underline"
                              >
                                Mark paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col items-center justify-between gap-2 border-t border-neutral-100 px-4 py-3 sm:flex-row">
            <p className="text-xs text-neutral-500">Showing last 30 days of activity (or all, if none)</p>
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((n) => Math.max(0, n - 1))}
                className="rounded border border-neutral-200 px-2 py-1 font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <span className="tabular-nums">
                Page {page + 1} of {pageCount}
              </span>
              <button
                type="button"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((n) => Math.min(pageCount - 1, n + 1))}
                className="rounded border border-neutral-200 px-2 py-1 font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-neutral-900">Payout trends</h2>
            <p className="text-xs text-neutral-500">Paid volume by month (last 6 months)</p>
            <div className="mt-4 h-[13rem] min-h-[13rem] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "var(--color-neutral-500)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "var(--color-neutral-500)" }}
                    tickFormatter={(v) =>
                      formatMajorUnitsCompact(Number(v), workspaceDefaultCurrency)
                    }
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(79, 70, 229, 0.06)" }}
                    formatter={(value) => {
                      const n = Number(value);
                      if (Number.isNaN(n)) return [String(value), "Paid"];
                      return [formatMajorUnitsAmount(n, workspaceDefaultCurrency), "Paid"];
                    }}
                  />
                  <Bar dataKey="dollars" radius={[6, 6, 0, 0]} name="Payouts" barSize={28}>
                    {chartData.map((e) => (
                      <Cell key={e.monthKey} fill={e.highlight ? "#4F46E5" : "#c4b5fd"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-neutral-900">Payout methods</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              InstaCRM records invoices and paid totals from the table above—there are no saved bank or wallet cards here.
              Track where you receive money (bank, UPI, PayPal, etc.) in your own tools; this page stays aligned with the
              payment rows you manage.
            </p>
          </div>
        </div>

        <EditInvoiceDialog
          payment={editPayment}
          open={editPayment != null}
          onOpenChange={(o) => {
            if (!o) setEditPayment(null);
          }}
          defaultWorkspaceCurrency={workspaceDefaultCurrency}
        />
      </div>
    </PageFade>
  );
}
