import { getDashboardData } from "@/lib/data/aggregate";
import { PageFade } from "@/components/layout/page-fade";
import { DashboardMetricRow } from "@/components/dashboard/dashboard-metric-row";
import { RevenueComposedChart } from "@/components/dashboard/revenue-composed-chart";
import { DealFunnelCard } from "@/components/dashboard/deal-funnel-card";
import { DashboardActivitySection } from "@/components/dashboard/dashboard-activity-section";
import { RemindersSection } from "@/components/dashboard/reminders-section";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { DashboardFooterBar } from "@/components/dashboard/dashboard-footer-bar";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const d = await getDashboardData();
  const funnelTotal =
    d.funnel.awareness + d.funnel.interest + d.funnel.negotiation + d.funnel.closed;
  const efficiencyPct = funnelTotal > 0 ? (d.funnel.closed / funnelTotal) * 100 : 0;

  return (
    <PageFade>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Welcome back, {d.firstName}. Here&apos;s how your creator business is performing.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600">
              {d.weekLabel}
            </span>
            <Link
              href="/tasks"
              className={cn(
                buttonVariants(),
                "rounded-full border-0 bg-gradient-to-r from-[#4F46E5] to-indigo-600 font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-[#4338ca] hover:to-indigo-600",
              )}
            >
              + Add goal
            </Link>
          </div>
        </div>

        <DashboardMetricRow
          leadCount={d.leadCount}
          dealCount={d.dealCount}
          revenueMtdCents={d.revenueMtdCents}
          pendingPayCents={d.pendingPayCents}
          taskOpen={d.taskOpen}
          pendingOverdueCount={d.pendingOverdueCount}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Revenue growth</h2>
                <p className="text-xs text-neutral-500">Paid invoices by month</p>
              </div>
            </div>
            <RevenueComposedChart data={d.monthlyChart} />
          </div>
          <DealFunnelCard
            funnel={d.funnel}
            efficiencyPct={efficiencyPct}
            avgCycleDays={12}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <DashboardActivitySection recentLeads={d.recentLeads} />
          <RemindersSection reminders={d.reminders} />
          <QuickActionsCard />
        </div>

        <DashboardFooterBar />
      </div>
    </PageFade>
  );
}
