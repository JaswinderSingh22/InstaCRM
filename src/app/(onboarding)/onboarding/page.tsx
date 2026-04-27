import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { OnboardingProvisioning } from "@/components/onboarding/onboarding-provisioning";
import { getUserOrRedirect, loadSessionProfile } from "@/lib/auth/workspace";
import { ensureUserWorkspace } from "@/app/actions/ensure-workspace";
import { parseOnboardingRecord } from "@/lib/onboarding/parse-initial";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding — InstaCRM",
};

export default async function OnboardingPage() {
  const user = await getUserOrRedirect();
  const ensured = await ensureUserWorkspace();
  let profile = await loadSessionProfile(user.id);
  if (!profile && ensured.ok) {
    await new Promise((r) => setTimeout(r, 150));
    profile = await loadSessionProfile(user.id);
  }
  if (!profile) {
    return (
      <OnboardingProvisioning
        lastError={
          ensured.ok
            ? "Could not read your profile after setup. Confirm RLS on public.profiles allows select for id = auth.uid()."
            : ensured.error
        }
      />
    );
  }
  if (profile.onboarding_completed_at) {
    redirect("/dashboard");
  }

  const initial = parseOnboardingRecord(profile.onboarding_answers);
  if (profile.full_name?.trim() && !initial.fullName) {
    initial.fullName = profile.full_name.trim();
  }

  return <OnboardingWizard initial={initial} profileName={profile.full_name} />;
}
