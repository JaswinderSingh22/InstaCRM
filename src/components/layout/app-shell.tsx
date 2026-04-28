import { AppLayoutClient } from "@/components/layout/app-layout-client";
import type { WorkspaceUsageBadge } from "@/lib/billing/workspace-usage";
import type { User } from "@supabase/supabase-js";

type Props = {
  children: React.ReactNode;
  user: User;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  usage: WorkspaceUsageBadge | null;
};

export function AppShell({ children, user, profile, usage }: Props) {
  return (
    <AppLayoutClient user={user} profile={profile} usage={usage}>
      {children}
    </AppLayoutClient>
  );
}
