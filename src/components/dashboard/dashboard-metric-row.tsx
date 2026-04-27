import { Users, LineChart, DollarSign, AlertCircle, ListTodo } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type Props = {
  leadCount: number;
  dealCount: number;
  revenueMtdCents: number;
  pendingPayCents: number;
  taskOpen: number;
  pendingOverdueCount: number;
  workspaceDefaultCurrency: string;
};

export function DashboardMetricRow({
  leadCount,
  dealCount,
  revenueMtdCents,
  pendingPayCents,
  taskOpen,
  pendingOverdueCount,
  workspaceDefaultCurrency,
}: Props) {
  const cards = [
    {
      label: "Total leads",
      value: leadCount.toLocaleString(),
      sub: "In your workspace",
      subClass: "text-emerald-600",
      icon: Users,
    },
    {
      label: "Active deals",
      value: String(dealCount),
      sub: dealCount > 0 ? `${dealCount} active` : "No open deals",
      subClass: "text-blue-600",
      icon: LineChart,
    },
    {
      label: "Revenue (MTD)",
      value: formatMoney(revenueMtdCents, workspaceDefaultCurrency),
      sub: revenueMtdCents > 0 ? "Paid invoices" : "—",
      subClass: "text-emerald-600",
      icon: DollarSign,
    },
    {
      label: "Pending pay",
      value: formatMoney(pendingPayCents, workspaceDefaultCurrency),
      sub: pendingOverdueCount > 0 ? `${pendingOverdueCount} overdue` : "On track",
      subClass: pendingOverdueCount > 0 ? "text-amber-600" : "text-neutral-500",
      icon: AlertCircle,
    },
    {
      label: "Tasks due",
      value: String(taskOpen),
      sub: taskOpen > 0 ? "Open" : "All clear",
      subClass: "text-violet-600",
      icon: ListTodo,
    },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-neutral-500">{c.label}</p>
            <c.icon className="size-4 text-[#4F46E5]/80" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-neutral-900">{c.value}</p>
          <p className={cn("mt-0.5 text-xs font-medium", c.subClass)}>{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
