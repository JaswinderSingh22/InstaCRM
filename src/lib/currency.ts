/**
 * Workspace CRM currencies (onboarding + settings). Subscription pricing stays USD — see pricing-plans.ts.
 */
export const WORKSPACE_CURRENCY_OPTIONS = [
  { code: "INR", label: "Indian rupee", symbol: "₹" },
  { code: "USD", label: "US dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British pound", symbol: "£" },
  { code: "AUD", label: "Australian dollar", symbol: "A$" },
  { code: "CAD", label: "Canadian dollar", symbol: "CA$" },
  { code: "SGD", label: "Singapore dollar", symbol: "S$" },
  { code: "AED", label: "UAE dirham", symbol: "د.إ" },
] as const;

const ALLOWED = new Set<string>(WORKSPACE_CURRENCY_OPTIONS.map((o) => o.code));

export function normalizeWorkspaceCurrency(code: string | null | undefined): string {
  const c = (code ?? "").trim().toUpperCase();
  if (ALLOWED.has(c)) return c;
  return "INR";
}
