export type FollowerTier = "nano" | "micro" | "mid" | "macro";

export type OnboardingAnswers = {
  fullName?: string;
  instagramHandle?: string;
  followerTier?: FollowerTier;
  /** Exact count if user provided */
  followerCount?: number;
  niche?: string;
  monetization?: string;
  /** ISO 4217 code for workspace CRM display */
  preferredCurrency?: string;
  growthGoals?: string;
};

export const ONBOARDING_STEPS = [
  { id: 1, key: "identity", label: "Personal Identity" },
  { id: 2, key: "instagram", label: "Instagram Profile" },
  { id: 3, key: "metrics", label: "Creator Metrics" },
  { id: 4, key: "niche", label: "Niche & Content" },
  { id: 5, key: "monetization", label: "Monetization" },
  { id: 6, key: "currency", label: "Currency" },
  { id: 7, key: "goals", label: "Growth Goals" },
] as const;

export function isFollowerTier(v: string): v is FollowerTier {
  return v === "nano" || v === "micro" || v === "mid" || v === "macro";
}
