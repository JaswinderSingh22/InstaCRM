/**
 * Single source of truth for public pricing (landing + in-app billing).
 * Stripe checkout still uses your configured price IDs; amounts here are what we display.
 *
 * All plan amounts are US dollars (USD). Workspace CRM money (deals, campaigns, etc.) uses
 * the user's chosen currency separately — do not convert these figures.
 */

export const YEARLY_BILLING_DISCOUNT = 0.2;

export const PRICING = {
  starter: {
    id: "starter" as const,
    name: "Starter",
    monthlyPrice: 0,
    description: "Perfect for micro-creators validating brand partnerships.",
    features: [
      "Up to 10 leads",
      "5 active deals",
      "Basic templates",
      "Email support",
    ],
    landing: { cta: "Get started", href: "/signup" as const },
  },
  proCreator: {
    id: "pro_creator" as const,
    name: "Pro Creator",
    monthlyPrice: 29,
    description: "For serious creators running multiple brand deals.",
    features: [
      "Unlimited leads & deals",
      "Custom CRM dashboard",
      "Advanced analytics",
      "Priority support",
    ],
    badge: "Most popular",
    landing: { cta: "Go Pro now", href: "/signup" as const },
  },
  talentAgency: {
    id: "talent_agency" as const,
    name: "Talent Agency",
    monthlyPrice: 99,
    description: "Manage your full roster and agency operations.",
    features: [
      "Up to 10 creator seats",
      "Agency-wide reporting",
      "Multi-creator management",
      "Commission-friendly workflows",
    ],
    landing: { cta: "Contact sales", href: "mailto:hello@instacrm.app" as const },
  },
} as const;

/** Per-month equivalent when paying yearly (20% off total annual vs 12× monthly). */
export function yearlyMonthlyEquivalent(monthly: number) {
  if (monthly <= 0) return 0;
  return Math.round(monthly * 12 * (1 - YEARLY_BILLING_DISCOUNT)) / 12;
}

/** Format a subscription plan price in USD (not workspace CRM currency). */
export function formatPlanPrice(amount: number) {
  if (amount <= 0) return "$0";
  if (Number.isInteger(amount)) return `$${amount}`;
  return `$${amount.toFixed(2)}`;
}
