import { formatMoney } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, ListChecks, LineChart } from "lucide-react";

const icons = { leads: Users, deals: Target, tasks: ListChecks, pipeline: LineChart } as const;

type Props = {
  leadCount: number;
  dealCount: number;
  taskOpen: number;
  pipelineCents: number;
};

export function MetricTiles({ leadCount, dealCount, taskOpen, pipelineCents }: Props) {
  const items = [
    { key: "leads" as const, label: "Leads", value: String(leadCount) },
    { key: "deals" as const, label: "Deals", value: String(dealCount) },
    { key: "tasks" as const, label: "Open tasks", value: String(taskOpen) },
    { key: "pipeline" as const, label: "Open pipeline", value: formatMoney(pipelineCents) },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => {
        const I = icons[it.key];
        return (
          <Card
            key={it.key}
            className="border-border/60 bg-card/40 backdrop-blur transition-transform hover:translate-y-[-1px]"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {it.label}
              </CardTitle>
              <I className="size-4 text-primary/80" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {it.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
