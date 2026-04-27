import { AppLayoutClient } from "@/components/layout/app-layout-client";
import type { User } from "@supabase/supabase-js";

type Props = {
  children: React.ReactNode;
  user: User;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export function AppShell({ children, user, profile }: Props) {
  return (
    <AppLayoutClient user={user} profile={profile}>
      {children}
    </AppLayoutClient>
  );
}
