import { createClient } from "@/lib/supabase/server";
import type { Brand, BrandActivity, BrandContact, Deal, Payment } from "@/types/database";

export type PartnershipTone = "green" | "orange" | "blue" | "neutral";

export type BrandWithMetrics = Brand & {
  partnership: { label: string; tone: PartnershipTone };
  metrics: {
    revenueCents: number;
    dealCount: number;
    avgPayDays: number | null;
  };
};

function partnershipFromDeals(deals: Pick<Deal, "stage">[]): {
  label: string;
  tone: PartnershipTone;
} {
  const won = deals.filter((d) => d.stage === "won").length;
  const hasNeg = deals.some((d) => d.stage === "negotiation" || d.stage === "proposal");
  if (won > 0 && deals.length >= 3) {
    return { label: "LONG-TERM CONTRACT", tone: "green" };
  }
  if (won > 0) {
    return { label: "ACTIVE PARTNERSHIP", tone: "green" };
  }
  if (hasNeg) {
    return { label: "IN NEGOTIATION", tone: "orange" };
  }
  if (deals.length > 0) {
    return { label: "IN DISCOVERY", tone: "blue" };
  }
  return { label: "PROSPECT", tone: "neutral" };
}

function avgPayDays(
  brandId: string,
  deals: Deal[],
  payments: Payment[],
): number | null {
  const dealIds = new Set(deals.filter((d) => d.brand_id === brandId).map((d) => d.id));
  const days: number[] = [];
  for (const p of payments) {
    if (p.status !== "paid" || !p.paid_at || !p.deal_id || !dealIds.has(p.deal_id)) continue;
    const deal = deals.find((d) => d.id === p.deal_id);
    if (!deal?.close_date) continue;
    const a = new Date(p.paid_at).getTime();
    const b = new Date(deal.close_date).getTime();
    if (Number.isFinite(a) && Number.isFinite(b)) {
      days.push(Math.max(0, Math.round((a - b) / 86400000)));
    }
  }
  if (days.length === 0) return null;
  return Math.round(days.reduce((s, d) => s + d, 0) / days.length);
}

export async function getBrandsPageData(workspaceId: string) {
  const supabase = await createClient();
  const [brandsRes, dealsRes, paymentsRes, contactsRes, activitiesRes] = await Promise.all([
    supabase.from("brands").select("*").eq("workspace_id", workspaceId).order("name"),
    supabase.from("deals").select("*").eq("workspace_id", workspaceId),
    supabase.from("payments").select("*").eq("workspace_id", workspaceId),
    supabase.from("partner_contacts").select("*").eq("workspace_id", workspaceId),
    supabase
      .from("relationship_events")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("occurred_at", { ascending: false })
      .limit(100),
  ]);

  if (brandsRes.error) throw new Error(brandsRes.error.message);
  if (dealsRes.error) throw new Error(dealsRes.error.message);
  if (paymentsRes.error) throw new Error(paymentsRes.error.message);
  if (contactsRes.error) throw new Error(contactsRes.error.message);
  if (activitiesRes.error) throw new Error(activitiesRes.error.message);

  const brands = (brandsRes.data ?? []) as Brand[];
  const deals = (dealsRes.data ?? []) as Deal[];
  const payments = (paymentsRes.data ?? []) as Payment[];
  const contacts = (contactsRes.data ?? []) as BrandContact[];
  const activities = (activitiesRes.data ?? []) as BrandActivity[];

  return {
    brands: buildBrandMetrics(brands, deals, payments),
    contacts,
    activities,
    brandNameById: Object.fromEntries(brands.map((b) => [b.id, b.name])) as Record<string, string>,
  };
}

function buildBrandMetrics(brands: Brand[], deals: Deal[], payments: Payment[]) {
  const byBrand = (bid: string) => deals.filter((d) => d.brand_id === bid);
  return brands.map((b) => {
    const bd = byBrand(b.id);
    const revenueCents = bd.filter((d) => d.stage === "won").reduce((s, d) => s + d.value_cents, 0);
    return {
      ...b,
      partnership: partnershipFromDeals(bd),
      metrics: {
        revenueCents,
        dealCount: bd.length,
        avgPayDays: avgPayDays(b.id, deals, payments),
      },
    } satisfies BrandWithMetrics;
  });
}
