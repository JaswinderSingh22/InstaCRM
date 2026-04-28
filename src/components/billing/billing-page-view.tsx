"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, Loader2, Sparkles } from "lucide-react";
import {
  PRICING,
  YEARLY_BILLING_DISCOUNT,
  yearlyMonthlyEquivalent,
} from "@/lib/pricing-plans";
import { leadCapForTier, normalizeTier } from "@/lib/billing/entitlements";

function capLabel(cap: number): string {
  if (cap >= 100_000) return "unlimited leads";
  if (cap >= 1000) return `${Math.round(cap / 1000)}k leads`;
  return `${cap} leads`;
}

type Props = {
  plan: string | null;
  subscriptionStatus: string;
  leadCount: number;
  /** AI campaign brief parses used this UTC month */
  aiBriefParsesUsed: number;
  /** null = unlimited (Agency) */
  aiBriefParsesLimit: number | null;
};

export function BillingPageView({
  plan,
  subscriptionStatus,
  leadCount,
  aiBriefParsesUsed,
  aiBriefParsesLimit,
}: Props) {
  const [interval, setInterval] = useState<"monthly" | "yearly">("yearly");
  const [load, setLoad] = useState<"checkout" | "portal" | null>(null);

  const tier = normalizeTier(plan, subscriptionStatus);
  const cap = leadCapForTier(tier);
  const usagePct = Math.min(100, Math.round((leadCount / Math.max(cap, 1)) * 100));
  const aiPct =
    aiBriefParsesLimit != null
      ? Math.min(100, Math.round((aiBriefParsesUsed / Math.max(aiBriefParsesLimit, 1)) * 100))
      : 0;

  const openCheckout = async () => {
    setLoad("checkout");
    try {
      const r = await fetch("/api/stripe/checkout", { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Request failed");
      if (j.url) window.location.href = j.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoad(null);
    }
  };

  const openPortal = async () => {
    setLoad("portal");
    try {
      const r = await fetch("/api/stripe/portal", { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Request failed");
      if (j.url) window.location.href = j.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoad(null);
    }
  };

  const proPrice =
    interval === "yearly"
      ? yearlyMonthlyEquivalent(PRICING.proCreator.monthlyPrice)
      : PRICING.proCreator.monthlyPrice;
  const agencyPrice =
    interval === "yearly"
      ? yearlyMonthlyEquivalent(PRICING.talentAgency.monthlyPrice)
      : PRICING.talentAgency.monthlyPrice;
  const savePct = Math.round(YEARLY_BILLING_DISCOUNT * 100);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Billing & Subscriptions
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your plan, invoices, and payment methods in one place.
          </p>
        </div>
        <Button
          type="button"
          className="h-10 w-full shrink-0 rounded-xl bg-gradient-to-r from-[#4F46E5] to-indigo-600 font-semibold text-white shadow-md hover:from-[#4338ca] hover:to-indigo-600 sm:h-9 sm:w-auto"
          onClick={() => void openPortal()}
          disabled={load !== null}
        >
          {load === "portal" ? <Loader2 className="size-4 animate-spin" /> : "Manage plan"}
        </Button>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-[#4F46E5] to-indigo-700 p-5 text-white shadow-lg shadow-indigo-500/25 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
          <div className="min-w-0 flex-1 space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-white">Current plan usage</h2>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-violet-100">
              <span>
                Leads: {leadCount.toLocaleString()} / {capLabel(cap)} ({usagePct}%)
              </span>
              <span className="text-violet-200/90">·</span>
              <span className="text-violet-200/90">Active leads only (archived excluded)</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-emerald-200/90 transition-all"
                style={{ width: `${aiBriefParsesLimit != null ? aiPct : 100}%` }}
              />
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-violet-100">
              <span>
                AI brief extractions (UTC month):{" "}
                {aiBriefParsesLimit != null ? (
                  <>
                    {aiBriefParsesUsed} / {aiBriefParsesLimit}
                  </>
                ) : (
                  <>unlimited</>
                )}
              </span>
              <span className="text-violet-200/90">·</span>
              <span className="text-violet-200/90">Pro: 120/mo · Free: 2/mo</span>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-full shrink-0 rounded-xl border-0 bg-white px-6 font-semibold text-[#4F46E5] hover:bg-violet-50 lg:w-auto lg:min-w-[10rem]"
            onClick={() => {
              if (tier === "free") void openCheckout();
              else void openPortal();
            }}
            disabled={load !== null}
          >
            {load !== null ? <Loader2 className="size-4 animate-spin" /> : "Upgrade plan"}
          </Button>
        </div>
      </div>

      <section>
          <p className="mb-4 text-xs text-neutral-500">
            Subscription plans are billed in <span className="font-medium text-neutral-700">US dollars (USD)</span>.
          </p>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setInterval("monthly")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  interval === "monthly"
                    ? "bg-[#4F46E5] text-white shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900",
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setInterval("yearly")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  interval === "yearly"
                    ? "bg-[#4F46E5] text-white shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900",
                )}
              >
                Yearly
              </button>
            </div>
            {interval === "yearly" ? (
              <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                Save {savePct}%
              </span>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PlanCard
              name={PRICING.starter.name}
              description={PRICING.starter.description}
              price={0}
              interval={interval}
              features={[...PRICING.starter.features]}
              cta={
                tier === "free" ? (
                  <Button variant="outline" className="w-full rounded-xl" disabled>
                    Current plan
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full rounded-xl" onClick={() => void openPortal()}>
                    Downgrade
                  </Button>
                )
              }
              highlighted={false}
            />
            <PlanCard
              name={PRICING.proCreator.name}
              description={PRICING.proCreator.description}
              price={proPrice}
              interval={interval}
              badge={PRICING.proCreator.badge}
              features={[...PRICING.proCreator.features]}
              cta={
                tier === "pro" ? (
                  <Button
                    className="w-full rounded-xl bg-gradient-to-r from-[#4F46E5] to-indigo-600 font-semibold text-white"
                    onClick={() => void openPortal()}
                    disabled={load !== null}
                  >
                    Manage plan
                  </Button>
                ) : (
                  <Button
                    className="w-full rounded-xl bg-gradient-to-r from-[#4F46E5] to-indigo-600 font-semibold text-white"
                    onClick={() => void openCheckout()}
                    disabled={load !== null}
                  >
                    {load === "checkout" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      `Upgrade to ${PRICING.proCreator.name}`
                    )}
                  </Button>
                )
              }
              highlighted
            />
            <PlanCard
              name={PRICING.talentAgency.name}
              description={PRICING.talentAgency.description}
              price={agencyPrice}
              interval={interval}
              features={[...PRICING.talentAgency.features]}
              cta={
                <Link
                  href={PRICING.talentAgency.landing.href}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full rounded-xl border-[#4F46E5] text-[#4F46E5] hover:bg-indigo-50",
                  )}
                >
                  {PRICING.talentAgency.landing.cta}
                </Link>
              }
              highlighted={false}
            />
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-neutral-900">Billing history</h2>
            <button
              type="button"
              onClick={() => void openPortal()}
              className="text-sm font-semibold text-[#4F46E5] hover:underline"
            >
              Open Stripe customer portal →
            </button>
          </div>
          <Card className="border-neutral-200/80 bg-white shadow-sm ring-neutral-200/60">
            <CardContent className="py-10 text-center">
              <p className="mx-auto max-w-md text-sm text-neutral-600">
                Invoices and receipts for your <span className="font-medium text-neutral-800">subscription</span> live in
                Stripe. Use{" "}
                <button
                  type="button"
                  onClick={() => void openPortal()}
                  className="font-semibold text-[#4F46E5] hover:underline"
                >
                  Manage plan
                </button>{" "}
                to download PDFs and update payment methods.
              </p>
              <p className="mx-auto mt-3 max-w-md text-xs text-neutral-500">
                Creator payouts and campaign invoices are tracked separately under{" "}
                <Link href="/payments" className="font-semibold text-[#4F46E5] hover:underline">
                  Payments
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="border-neutral-200/80 bg-white shadow-sm ring-neutral-200/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-neutral-900">Payment method</CardTitle>
              <CardDescription>Manage cards and bank details for your workspace subscription.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-neutral-600">
                We don&apos;t display saved cards here. Open the Stripe customer portal to view or edit payment methods.
              </p>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => void openPortal()}>
                Manage payment methods in Stripe
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-indigo-950 p-6 text-white shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-violet-300" />
                <h3 className="text-lg font-bold">Need a custom plan?</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                Contact our sales team for enterprise features, custom integrations, and specialized reporting
                tailored to your creator network.
              </p>
            </div>
            <Link
              href={`${PRICING.talentAgency.landing.href}?subject=${encodeURIComponent("Custom plan inquiry")}`}
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "mt-6 w-fit rounded-xl border-0 bg-white font-semibold text-neutral-900 hover:bg-neutral-100",
              )}
            >
              {PRICING.talentAgency.landing.cta}
            </Link>
          </div>
        </section>

      <p className="text-xs text-neutral-500">
        Subscription status: <span className="font-medium text-neutral-700">{subscriptionStatus}</span>
        {plan ? (
          <>
            {" "}
            · Plan label: <span className="font-medium text-neutral-700">{plan}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}

function PlanCard({
  name,
  description,
  price,
  interval,
  features,
  cta,
  highlighted,
  badge,
}: {
  name: string;
  description: string;
  price: number;
  interval: "monthly" | "yearly";
  features: string[];
  cta: ReactNode;
  highlighted: boolean;
  badge?: string;
}) {
  return (
    <Card
      className={cn(
        "relative flex flex-col border-neutral-200/80 bg-white shadow-sm ring-neutral-200/60",
        highlighted && "border-2 border-[#4F46E5] shadow-md shadow-indigo-500/10 ring-0",
      )}
    >
      {badge ? (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#4F46E5] px-3 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
          {badge}
        </div>
      ) : null}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-neutral-900">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="pt-2">
          <span className="text-3xl font-bold tabular-nums text-neutral-900">
            ${price === 0 ? "0" : price % 1 === 0 ? String(Math.round(price)) : price.toFixed(2)}
          </span>
          <span className="text-sm text-neutral-500">{price === 0 ? "/mo" : interval === "yearly" ? "/mo, billed yearly" : "/mo"}</span>
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex flex-1 flex-col gap-4 pt-0">
        <ul className="space-y-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-neutral-700">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              {f}
            </li>
          ))}
        </ul>
        {cta}
      </CardContent>
    </Card>
  );
}
