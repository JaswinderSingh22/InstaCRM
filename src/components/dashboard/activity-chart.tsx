"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Pt = { date: string; amount: number };

export function ActivityChart({ data }: { data: Pt[] }) {
  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cvg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(262, 50%, 55%)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(262, 50%, 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            className="stroke-border/50"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs" />
          <YAxis
            tickLine={false}
            axisLine={false}
            className="text-xs"
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(v) => {
              const n = typeof v === "number" ? v : 0;
              return [`$${n.toFixed(0)}`, "Paid"];
            }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            name="Revenue (30d)"
            stroke="hsl(262, 50%, 55%)"
            fill="url(#cvg)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
