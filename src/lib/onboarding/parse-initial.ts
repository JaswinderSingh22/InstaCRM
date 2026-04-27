import type { OnboardingAnswers } from "@/lib/types/onboarding";
import { isFollowerTier } from "@/lib/types/onboarding";

export function parseOnboardingRecord(r: Record<string, unknown> | null): Partial<OnboardingAnswers> {
  if (!r) return {};
  const out: Partial<OnboardingAnswers> = {};
  if (typeof r.fullName === "string") out.fullName = r.fullName;
  if (typeof r.instagramHandle === "string") out.instagramHandle = r.instagramHandle;
  if (typeof r.followerTier === "string" && isFollowerTier(r.followerTier)) {
    out.followerTier = r.followerTier;
  }
  if (typeof r.followerCount === "number" && Number.isFinite(r.followerCount)) {
    out.followerCount = r.followerCount;
  }
  if (typeof r.niche === "string") out.niche = r.niche;
  if (typeof r.monetization === "string") out.monetization = r.monetization;
  if (typeof r.growthGoals === "string") out.growthGoals = r.growthGoals;
  return out;
}
