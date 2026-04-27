"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isFollowerTier, type OnboardingAnswers } from "@/lib/types/onboarding";

function sanitize(
  a: OnboardingAnswers,
): Record<string, string | number | undefined> {
  const out: Record<string, string | number | undefined> = {
    fullName: a.fullName?.trim() || undefined,
    instagramHandle: a.instagramHandle?.replace(/^@/, "").trim() || undefined,
    niche: a.niche?.trim() || undefined,
    monetization: a.monetization?.trim() || undefined,
    growthGoals: a.growthGoals?.trim() || undefined,
  };
  if (a.followerTier && isFollowerTier(a.followerTier)) {
    out.followerTier = a.followerTier;
  }
  if (a.followerCount != null && Number.isFinite(a.followerCount) && a.followerCount >= 0) {
    out.followerCount = Math.round(a.followerCount);
  }
  return out;
}

export async function saveOnboardingProgress(answers: OnboardingAnswers) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in" as const };
  }
  const merged = sanitize(answers);
  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_answers: merged as unknown as Record<string, never> })
    .eq("id", user.id);
  if (error) {
    return { error: error.message };
  }
  return { ok: true as const };
}

export async function completeOnboarding(answers: OnboardingAnswers) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in" as const };
  }
  const merged = sanitize(answers);
  const fullName = (merged.fullName as string | undefined)?.trim() || null;

  const updatePayload: Record<string, unknown> = {
    onboarding_answers: merged,
    onboarding_completed_at: new Date().toISOString(),
  };
  if (fullName) {
    updatePayload.full_name = fullName;
  }

  const { error } = await supabase.from("profiles").update(updatePayload).eq("id", user.id);

  if (error) {
    return { error: error.message };
  }
  revalidatePath("/", "layout");
  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
