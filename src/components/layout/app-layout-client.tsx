"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { cn } from "@/lib/utils";

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
};

export function AppLayoutClient({
  children,
  user,
  profile,
}: {
  children: ReactNode;
  user: User;
  profile: Profile | null;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const name =
    profile?.full_name?.trim() ||
    (user.user_metadata as { full_name?: string })?.full_name ||
    (user.user_metadata as { name?: string })?.name ||
    "";

  const avatarUrl =
    profile?.avatar_url ??
    (typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#F4F5FA] text-neutral-900">
      <button
        type="button"
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 md:hidden",
          mobileNavOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-label="Close navigation menu"
        onClick={() => setMobileNavOpen(false)}
      />
      <AppSidebar mobileOpen={mobileNavOpen} />
      <div className="min-w-0 md:pl-60">
        <AppHeader
          email={user.email ?? ""}
          name={name}
          avatarUrl={avatarUrl}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="p-4 pb-6 sm:p-6 lg:px-8 lg:pb-8">{children}</main>
      </div>
    </div>
  );
}
