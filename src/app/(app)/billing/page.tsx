import { requireWorkspace } from "@/lib/auth/workspace";
import {
  aiBriefParseLimitForTier,
  currentUtcMonthKey,
  normalizeTier,
} from "@/lib/billing/entitlements";
import { createClient } from "@/lib/supabase/server";
import { PageFade } from "@/components/layout/page-fade";
import { BillingPageView } from "@/components/billing/billing-page-view";

export const metadata = { title: "Billing & Subscriptions" };

export default async function BillingPage() {
  const { workspaceId } = await requireWorkspace();
  const supabase = await createClient();

  const [{ data: ws, error }, { count: leadCount }] = await Promise.all([
    supabase
      .from("workspaces")
      .select("plan, subscription_status, ai_brief_parses_count, ai_brief_parses_period")
      .eq("id", workspaceId)
      .single(),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("archived_at", null),
  ]);

  if (error || !ws) {
    return <p className="text-destructive">Could not load workspace</p>;
  }

  const row = ws as {
    plan: string | null;
    subscription_status: string | null;
    ai_brief_parses_count?: number | null;
    ai_brief_parses_period?: string | null;
  };

  const tier = normalizeTier(row.plan, row.subscription_status ?? "");
  const monthUtc = currentUtcMonthKey();
  const aiBriefParsesUsed =
    row.ai_brief_parses_period === monthUtc ? Number(row.ai_brief_parses_count ?? 0) : 0;
  const aiBriefParsesLimit = aiBriefParseLimitForTier(tier);

  return (
    <PageFade>
      <BillingPageView
        plan={ws.plan as string | null}
        subscriptionStatus={ws.subscription_status as string}
        leadCount={leadCount ?? 0}
        aiBriefParsesUsed={aiBriefParsesUsed}
        aiBriefParsesLimit={aiBriefParsesLimit}
      />
    </PageFade>
  );
}
