import { AppShell } from "@/components/layout/app-shell";
import { getSessionAndWorkspace } from "@/lib/auth/workspace";
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
  return (
    <AppShell user={ctx.user} profile={ctx.profile}>
      {children}
    </AppShell>
  );
}
