import { getDashboardData } from "@/lib/data/aggregate";
import { PageFade } from "@/components/layout/page-fade";
import { DashboardMetricRow } from "@/components/dashboard/dashboard-metric-row";
import { RevenueComposedChart } from "@/components/dashboard/revenue-composed-chart";
import { DealFunnelCard } from "@/components/dashboard/deal-funnel-card";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const d = await getDashboardData();
  const funnelTotal =
    d.funnel.awareness + d.funnel.interest + d.funnel.negotiation + d.funnel.closed;
  const efficiencyPct = funnelTotal > 0 ? (d.funnel.closed / funnelTotal) * 100 : 0;

  return (
    <PageFade>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Analytics</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Revenue, pipeline funnel, and workspace KPIs for {d.weekLabel}.
          </p>
        </div>

        <DashboardMetricRow
          leadCount={d.leadCount}
          dealCount={d.dealCount}
          revenueMtdCents={d.revenueMtdCents}
          pendingPayCents={d.pendingPayCents}
          taskOpen={d.taskOpen}
          pendingOverdueCount={d.pendingOverdueCount}
          workspaceDefaultCurrency={d.workspaceDefaultCurrency}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Revenue growth</h2>
                <p className="text-xs text-neutral-500">Paid invoices by month</p>
              </div>
            </div>
            <RevenueComposedChart
              data={d.monthlyChart}
              workspaceDefaultCurrency={d.workspaceDefaultCurrency}
            />
          </div>
          <DealFunnelCard
            funnel={d.funnel}
            efficiencyPct={efficiencyPct}
            avgCycleDays={12}
          />
        </div>
      </div>
    </PageFade>
  );
}
