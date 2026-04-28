import type { SupabaseClient } from "@supabase/supabase-js";
import {
  aiBriefParseLimitForTier,
  currentUtcMonthKey,
  leadCapForTier,
  normalizeTier,
  type BillingTier,
} from "@/lib/billing/entitlements";

export type WorkspaceUsageBadge = {
  tier: BillingTier;
  tierLabel: string;
  leadsUsed: number;
  leadsCap: number;
  aiUsed: number;
  aiLimit: number | null;
};

export function tierDisplayName(tier: BillingTier): string {
  if (tier === "agency") return "Agency";
  if (tier === "pro") return "Pro Creator";
  return "Free";
}

/** Server-only: workspace plan + usage for nav header. */
export async function fetchWorkspaceUsageBadge(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<WorkspaceUsageBadge | null> {
  const [{ data: ws, error: wsErr }, { count: leadCount, error: leadErr }] = await Promise.all([
    supabase
      .from("workspaces")
      .select("plan, subscription_status, ai_brief_parses_count, ai_brief_parses_period")
      .eq("id", workspaceId)
      .maybeSingle(),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("archived_at", null),
  ]);

  if (wsErr || leadErr || !ws) return null;

  const row = ws as {
    plan: string | null;
    subscription_status: string | null;
    ai_brief_parses_count?: number | null;
    ai_brief_parses_period?: string | null;
  };

  const tier = normalizeTier(row.plan, row.subscription_status ?? "");
  const monthUtc = currentUtcMonthKey();
  const aiUsed =
    row.ai_brief_parses_period === monthUtc ? Number(row.ai_brief_parses_count ?? 0) : 0;

  return {
    tier,
    tierLabel: tierDisplayName(tier),
    leadsUsed: leadCount ?? 0,
    leadsCap: leadCapForTier(tier),
    aiUsed,
    aiLimit: aiBriefParseLimitForTier(tier),
  };
}
