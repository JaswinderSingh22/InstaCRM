import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
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
    <div className="min-h-dvh bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(262_60%_22%/0.35),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(262_45%_35%/0.12),transparent)]">
      <AppSidebar />
      <div className="pl-60">
        <AppHeader
          email={user.email ?? ""}
          name={profile?.full_name?.trim() || user.user_metadata?.full_name || user.user_metadata?.name || ""}
          avatarUrl={profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null}
        />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
