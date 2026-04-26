import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { subDays, format } from "date-fns";

export async function getDashboardData() {
  const { workspaceId } = await requireWorkspace();
  const supabase = await createClient();
  const since = subDays(new Date(), 30);

  const [
    { count: leadCount },
    { count: dealCount },
    { count: taskOpen },
    paidResult,
    deals,
    { data: recentLeads },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("completed", false),
    supabase
      .from("payments")
      .select("amount_cents")
      .eq("workspace_id", workspaceId)
      .eq("status", "paid"),
    supabase
      .from("deals")
      .select("value_cents, stage, created_at")
      .eq("workspace_id", workspaceId)
      .in("stage", ["lead", "qualified", "proposal", "negotiation"]),
    supabase
      .from("leads")
      .select("id, name, company, status, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const pipeline = (deals.data ?? []).reduce(
    (s, d) => s + (d as { value_cents: number }).value_cents,
    0,
  );
  const paid = paidResult.data ?? [];
  const revenue = paid.reduce((s, p) => s + p.amount_cents, 0);

  const { data: paymentSeries } = await supabase
    .from("payments")
    .select("amount_cents, status, created_at, paid_at")
    .eq("workspace_id", workspaceId)
    .eq("status", "paid");
  const byDay: Record<string, number> = {};
  for (let i = 0; i < 30; i += 1) {
    byDay[format(subDays(new Date(), 29 - i), "MM/dd")] = 0;
  }
  for (const p of paymentSeries ?? []) {
    const d = p.paid_at || p.created_at;
    if (new Date(d) < since) continue;
    const k = format(new Date(d), "MM/dd");
    if (k in byDay) byDay[k] += p.amount_cents;
  }
  const chartData = Object.entries(byDay).map(([date, c]) => ({
    date,
    amount: c / 100,
  }));

  return {
    leadCount: leadCount ?? 0,
    dealCount: dealCount ?? 0,
    taskOpen: taskOpen ?? 0,
    pipelineCents: pipeline,
    revenueCents: revenue,
    recentLeads: recentLeads ?? [],
    chartData,
  };
}
