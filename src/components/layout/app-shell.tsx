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
    <div className="min-h-dvh bg-[#F4F5FA] text-neutral-900">
      <AppSidebar />
      <div className="pl-60">
        <AppHeader
          email={user.email ?? ""}
          name={profile?.full_name?.trim() || user.user_metadata?.full_name || user.user_metadata?.name || ""}
          avatarUrl={profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null}
        />
        <main className="p-4 sm:p-6 lg:px-8 lg:pb-8">{children}</main>
      </div>
    </div>
  );
}
