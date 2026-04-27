import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { DealsView } from "@/components/deals/deals-view";
import { PageFade } from "@/components/layout/page-fade";
import type { Deal, DealStage } from "@/types/database";

export const metadata = { title: "Deals" };

const OPEN_STAGES: DealStage[] = ["lead", "qualified", "proposal", "negotiation"];

export default async function DealsPage() {
  const { workspaceId, profile } = await requireWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("workspace_id", workspaceId);
  if (error) {
    return <p className="text-sm text-destructive">Could not load deals</p>;
  }
  const deals = (data ?? []) as Deal[];
  const openDeals = deals.filter((d) => OPEN_STAGES.includes(d.stage));
  const summary = {
    openCount: openDeals.length,
    pipelineValueCents: openDeals.reduce((s, d) => s + d.value_cents, 0),
    totalDeals: deals.length,
  };
  const key = deals.map((d) => `${d.id}-${d.stage}-${d.position}`).join("|");
  return (
    <PageFade>
      <DealsView
        key={key}
        initial={deals}
        summary={summary}
        workspaceDefaultCurrency={profile.workspace_default_currency}
      />
    </PageFade>
  );
}
