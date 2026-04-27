import { createClient } from "@/lib/supabase/server";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

export type LeadsPageInsights = {
  campaignReady: {
    openDealsCount: number;
    dealsInNegotiation: number;
  };
  leadGrowth: {
    pctVsPreviousMonth: number;
    thisMonthCount: number;
    prevMonthCount: number;
    /** Last 6 calendar months, oldest first — for mini chart. */
    monthlyCounts: { label: string; count: number }[];
  };
};

function monthBuckets(now: Date) {
  const buckets: { start: Date; end: Date; label: string }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = subMonths(now, i);
    buckets.push({
      start: startOfMonth(d),
      end: endOfMonth(d),
      label: d.toLocaleString("en-US", { month: "short" }),
    });
  }
  return buckets;
}

export async function getLeadsPageInsights(workspaceId: string): Promise<LeadsPageInsights> {
  const supabase = await createClient();
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const buckets = monthBuckets(now);

  const [
    { count: openDealsCount },
    { count: dealsInNegotiation },
    { data: leadsCreatedRows },
  ] = await Promise.all([
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .in("stage", ["lead", "qualified", "proposal", "negotiation"]),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("stage", "negotiation"),
    supabase
      .from("leads")
      .select("created_at")
      .eq("workspace_id", workspaceId),
  ]);

  const rows = leadsCreatedRows ?? [];
  const inRange = (iso: string, start: Date, end: Date) => {
    const t = new Date(iso).getTime();
    return t >= start.getTime() && t <= end.getTime();
  };

  let thisMonthCount = 0;
  let prevMonthCount = 0;
  for (const r of rows) {
    const iso = (r as { created_at: string }).created_at;
    if (inRange(iso, thisMonthStart, now)) thisMonthCount += 1;
    else if (inRange(iso, prevMonthStart, prevMonthEnd)) prevMonthCount += 1;
  }

  const monthlyCounts = buckets.map((b) => ({
    label: b.label,
    count: rows.filter((r) => inRange((r as { created_at: string }).created_at, b.start, b.end)).length,
  }));

  const pctVsPreviousMonth =
    prevMonthCount === 0
      ? thisMonthCount > 0
        ? 100
        : 0
      : Math.round(((thisMonthCount - prevMonthCount) / prevMonthCount) * 100);

  return {
    campaignReady: {
      openDealsCount: openDealsCount ?? 0,
      dealsInNegotiation: dealsInNegotiation ?? 0,
    },
    leadGrowth: {
      pctVsPreviousMonth,
      thisMonthCount,
      prevMonthCount,
      monthlyCounts,
    },
  };
}
