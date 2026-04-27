"use client";

import { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import type { DashboardMonthly } from "@/lib/data/aggregate";

type Row = DashboardMonthly;

export function RevenueComposedChart({ data }: { data: Row[] }) {
  const [mode, setMode] = useState<"commission" | "ad_spend">("commission");
  const chartData = data.map((d) => ({
    name: d.monthLabel + (d.isCurrent ? " (Current)" : ""),
    monthLabel: d.monthLabel,
    isCurrent: d.isCurrent,
    bar: d.revenue,
    line: d.line * (mode === "commission" ? 1 : 0.75),
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <span
          className={cn("text-xs font-medium", mode === "commission" ? "text-[#4F46E5]" : "text-neutral-500")}
        >
          Commission
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={mode === "ad_spend"}
          aria-label="Toggle ad spend view"
          onClick={() => setMode((m) => (m === "commission" ? "ad_spend" : "commission"))}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            mode === "ad_spend" ? "bg-[#4F46E5]" : "bg-neutral-200",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
              mode === "ad_spend" ? "left-5" : "left-0.5",
            )}
          />
        </button>
        <span
          className={cn("text-xs font-medium", mode === "ad_spend" ? "text-[#4F46E5]" : "text-neutral-500")}
        >
          Ad Spend
        </span>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a5b4fc" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200" vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tickLine={false}
              axisLine={false}
              tick={{ className: "text-xs fill-neutral-500" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ className: "text-xs fill-neutral-500" }}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
              }}
              formatter={(v) => {
                const n = typeof v === "number" ? v : Number(v);
                return [`$${Number.isFinite(n) ? n.toLocaleString() : String(v)}`, ""];
              }}
            />
            <Bar dataKey="bar" fill="url(#revenueBarGrad)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Line
              type="monotone"
              dataKey="line"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ fill: "#3b82f6", r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
