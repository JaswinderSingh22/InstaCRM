/**
 * Workspace subscription tier and usage limits for CRM features.
 * Billing amounts stay USD — see pricing-plans.ts.
 */

export type BillingTier = "free" | "pro" | "agency";

export function normalizeTier(plan: string | null, subscriptionStatus: string): BillingTier {
  const p = (plan ?? "").toLowerCase();
  const s = subscriptionStatus.toLowerCase();
  if (p.includes("agency")) return "agency";
  if (p.includes("pro") || s === "active" || s === "trialing") return "pro";
  return "free";
}

/** Active (non-archived) leads allowed per tier. */
export function leadCapForTier(tier: BillingTier): number {
  if (tier === "free") return 5;
  if (tier === "agency") return 100_000;
  return 50_000;
}

/**
 * Monthly AI campaign-brief parses (UTC calendar month).
 * Free: 2/mo — Pro: 120/mo — Agency: unlimited.
 */
export function aiBriefParseLimitForTier(tier: BillingTier): number | null {
  if (tier === "agency") return null;
  if (tier === "pro") return 120;
  return 2;
}

export function currentUtcMonthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
