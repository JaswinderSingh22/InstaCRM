import { getDashboardData } from "@/lib/data/aggregate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { MetricTiles } from "@/components/dashboard/metric-tiles";
import { formatMoney } from "@/lib/money";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { PageFade } from "@/components/layout/page-fade";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const d = await getDashboardData();
  return (
    <PageFade>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Revenue, pipeline, and recent activity
        </p>
      </div>
      <MetricTiles
        leadCount={d.leadCount}
        dealCount={d.dealCount}
        taskOpen={d.taskOpen}
        pipelineCents={d.pipelineCents}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/30">
          <CardHeader>
            <CardTitle className="text-base">Paid revenue (30d)</CardTitle>
            <p className="text-2xl font-semibold">
              {formatMoney(d.revenueCents)}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                all time (paid)
              </span>
            </p>
          </CardHeader>
          <CardContent>
            <ActivityChart data={d.chartData} />
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/30">
          <CardHeader>
            <CardTitle className="text-base">Recent leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.recentLeads.length === 0 && (
              <p className="text-sm text-muted-foreground">No leads yet. Add from Leads.</p>
            )}
            {d.recentLeads.map(
              (l: { id: string; name: string; company: string | null; status: string; created_at: string }) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-md border border-border/50 bg-background/50 px-2 py-1.5 text-sm"
                >
                  <div>
                    <p className="font-medium">{l.name}</p>
                    {l.company ? (
                      <p className="text-xs text-muted-foreground">{l.company}</p>
                    ) : null}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">
                      {l.status}
                    </Badge>
                    <p>
                      {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      </div>
    </PageFade>
  );
}
