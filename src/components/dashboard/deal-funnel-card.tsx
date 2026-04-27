import type { DashboardFunnel } from "@/lib/data/aggregate";
import { cn } from "@/lib/utils";

const stages: { key: keyof DashboardFunnel; label: string; color: string }[] = [
  { key: "awareness", label: "Awareness", color: "bg-sky-400" },
  { key: "interest", label: "Interest", color: "bg-indigo-500" },
  { key: "negotiation", label: "Negotiation", color: "bg-violet-600" },
  { key: "closed", label: "Closed", color: "bg-[#4F46E5]" },
];

export function DealFunnelCard({
  funnel,
  efficiencyPct,
  avgCycleDays,
}: {
  funnel: DashboardFunnel;
  efficiencyPct: number;
  avgCycleDays: number;
}) {
  const max = Math.max(1, ...stages.map((s) => funnel[s.key]));
  return (
    <div className="flex h-full flex-col rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-neutral-900">Deal funnel</h3>
      <div className="mt-4 flex flex-1 flex-col items-center gap-2">
        {stages.map((s) => {
          const n = funnel[s.key];
          const w = 40 + (n / max) * 55;
          return (
            <div key={s.key} className="flex w-full flex-col items-center gap-0.5">
              <div
                className={cn("h-7 rounded-sm transition-all", s.color)}
                style={{ width: `${Math.min(100, w)}%` }}
              />
              <div className="flex w-full justify-between text-[11px] text-neutral-600">
                <span>{s.label}</span>
                <span className="font-semibold text-neutral-900">{n}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex border-t border-neutral-100 pt-3 text-xs">
        <div className="flex-1 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Efficiency</p>
          <p className="font-semibold text-neutral-900">{efficiencyPct.toFixed(1)}%</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Avg cycle</p>
          <p className="font-semibold text-neutral-900">{avgCycleDays} days</p>
        </div>
      </div>
    </div>
  );
}
