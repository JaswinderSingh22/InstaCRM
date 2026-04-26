import { AppShell } from "@/components/layout/app-shell";
import { getSessionAndWorkspace } from "@/lib/auth/workspace";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx.workspaceId) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          No workspace is linked to your account. If you just signed up, refresh in a
          moment, or re-run the database migration in Supabase.
        </p>
      </div>
    );
  }
  return (
    <AppShell user={ctx.user} profile={ctx.profile}>
      {children}
    </AppShell>
  );
}
