import { AppShell } from "@/components/layout/app-shell";
import { getSessionAndWorkspace } from "@/lib/auth/workspace";
import { fetchWorkspaceUsageBadge } from "@/lib/billing/workspace-usage";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx.profile.onboarding_completed_at) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const usage = await fetchWorkspaceUsageBadge(supabase, ctx.profile.default_workspace_id);

  return (
    <AppShell user={ctx.user} profile={ctx.profile} usage={usage}>
      {children}
    </AppShell>
  );
}
