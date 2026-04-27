import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Mail, CheckCircle2, User2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type Lead = { id: string; name: string; company: string | null; status: string; created_at: string };

const accent = [
  { icon: Mail, className: "bg-sky-100 text-sky-600" },
  { icon: CheckCircle2, className: "bg-emerald-100 text-emerald-600" },
  { icon: User2, className: "bg-orange-100 text-orange-600" },
  { icon: Pencil, className: "bg-violet-100 text-violet-600" },
];

export function DashboardActivitySection({ recentLeads }: { recentLeads: Lead[] }) {
  const items: { label: string; time: string; i: number }[] =
    recentLeads.length > 0
      ? recentLeads.slice(0, 4).map((l, i) => ({
          label: `New lead: ${l.name}${l.company ? ` (${l.company})` : ""}`,
          time: formatDistanceToNow(new Date(l.created_at), { addSuffix: true }),
          i: i % accent.length,
        }))
      : [
          { label: "Email sent to brand partner", time: "2 hours ago", i: 0 },
          { label: "Payment received", time: "5 hours ago", i: 1 },
          { label: "New lead identified", time: "Yesterday", i: 2 },
          { label: "Rate card updated", time: "Recent", i: 3 },
        ];

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">Activity feed</h3>
        <Link
          href="/leads"
          className="text-xs font-medium text-[#4F46E5] hover:underline"
        >
          View all
        </Link>
      </div>
      <ul className="space-y-3">
        {items.map((it, idx) => {
          const { icon: Icon, className: iconCls } = accent[it.i] ?? accent[0]!;
          return (
            <li key={idx} className="flex gap-3">
              <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", iconCls)}>
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-neutral-800">{it.label}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                  {it.time}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
