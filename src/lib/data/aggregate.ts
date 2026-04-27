import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek } from "date-fns";
import type { DealStage } from "@/types/database";

export type DashboardReminder = {
  id: string;
  title: string;
  dueAt: string;
};

export type DashboardFunnel = {
  awareness: number;
  interest: number;
  negotiation: number;
  closed: number;
};

export type DashboardMonthly = {
  month: string;
  monthLabel: string;
  revenue: number;
  isCurrent: boolean;
  line: number;
};

export async function getDashboardData() {
  const { workspaceId, profile } = await requireWorkspace();
  const supabase = await createClient();
  const now = new Date();
  const mtdStart = startOfMonth(now);

  const [
    { count: leadCount },
    { count: activeDealCount },
    { count: taskOpen },
    { data: recentLeads },
    { data: allDealsStages },
    { data: paymentsRows },
    { data: pendingPayments },
    { data: taskReminders },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .in("stage", ["lead", "qualified", "proposal", "negotiation"]),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("completed", false),
    supabase
      .from("leads")
      .select("id, name, company, status, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("deals").select("stage").eq("workspace_id", workspaceId),
    supabase
      .from("payments")
      .select("amount_cents, status, created_at, paid_at")
      .eq("workspace_id", workspaceId)
      .eq("status", "paid"),
    supabase
      .from("payments")
      .select("amount_cents, status, due_date")
      .eq("workspace_id", workspaceId)
      .in("status", ["pending", "overdue"]),
    supabase
      .from("tasks")
      .select("id, title, due_at")
      .eq("workspace_id", workspaceId)
      .eq("completed", false)
      .not("due_at", "is", null)
      .order("due_at", { ascending: true })
      .limit(5),
  ]);

  const paid = paymentsRows ?? [];
  const revenue = paid.reduce((s, p) => s + p.amount_cents, 0);

  const revenueMtdCents = (paymentsRows ?? []).reduce((s, p) => {
    const t = p.paid_at || p.created_at;
    if (!t) return s;
    const d = new Date(t);
    if (d < mtdStart || d > now) return s;
    return s + p.amount_cents;
  }, 0);

  const pend = pendingPayments ?? [];
  const pendingPayCents = pend.reduce((s, p) => s + p.amount_cents, 0);
  const pendingOverdueCount = pend.filter((p) => p.status === "overdue").length;

  const funnel: DashboardFunnel = {
    awareness: 0,
    interest: 0,
    negotiation: 0,
    closed: 0,
  };
  for (const row of allDealsStages ?? []) {
    const st = (row as { stage: DealStage }).stage;
    if (st === "lead") funnel.awareness += 1;
    else if (st === "qualified" || st === "proposal") funnel.interest += 1;
    else if (st === "negotiation") funnel.negotiation += 1;
    else if (st === "won") funnel.closed += 1;
  }

  const monthlyChart: DashboardMonthly[] = [];
  const paidRows = paymentsRows ?? [];
  for (let i = 6; i >= 0; i -= 1) {
    const m = subMonths(now, i);
    const mStart = startOfMonth(m);
    const mEnd = endOfMonth(m);
    const isCurrent = format(m, "yyyy-MM") === format(now, "yyyy-MM");
    let monthRevenueDollars = 0;
    for (const p of paidRows) {
      const t = p.paid_at || p.created_at;
      if (!t) continue;
      const d = new Date(t);
      if (d < mStart || d > mEnd) continue;
      monthRevenueDollars += p.amount_cents / 100;
    }
    const line = monthRevenueDollars * 0.92 + (isCurrent ? monthRevenueDollars * 0.05 : 0);
    monthlyChart.push({
      month: format(m, "yyyy-MM"),
      monthLabel: format(m, "MMM"),
      revenue: monthRevenueDollars,
      isCurrent,
      line,
    });
  }

  const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? "there";
  const weekOfStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekLabel = `Week of ${format(weekOfStart, "MMM d")}`;

  return {
    firstName,
    leadCount: leadCount ?? 0,
    dealCount: activeDealCount ?? 0,
    taskOpen: taskOpen ?? 0,
    revenueCents: revenue,
    revenueMtdCents,
    pendingPayCents,
    pendingOverdueCount,
    recentLeads: recentLeads ?? [],
    monthlyChart,
    funnel,
    reminders: (taskReminders ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      dueAt: t.due_at!,
    })) as DashboardReminder[],
    weekLabel,
  };
}
