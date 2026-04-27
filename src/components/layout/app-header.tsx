"use client";

import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { LogOut, Menu, MessageCircle, Search, User, Bell } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type Props = {
  email: string;
  name: string;
  avatarUrl: string | null;
  onOpenMobileNav?: () => void;
};

function initials(n: string) {
  if (!n.trim()) return "?";
  const p = n.split(/\s+/).filter(Boolean);
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0]! + p[1]![0]!).toUpperCase();
}

export function AppHeader({ email, name, avatarUrl, onOpenMobileNav }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const searchPlaceholder = pathname.startsWith("/deals")
    ? "Search deals, brands, or tags…"
    : pathname.startsWith("/calendar")
      ? "Search tasks, campaigns, or brands…"
      : pathname.startsWith("/payments")
        ? "Search brands, deals, or invoices…"
        : pathname.startsWith("/billing")
          ? "Search billing records…"
          : pathname.startsWith("/brands")
            ? "Search brands…"
            : pathname.startsWith("/settings")
              ? "Search creators, campaigns, or settings…"
              : pathname.startsWith("/leads")
                ? "Search leads, brands, or creators…"
                : "Search leads, brands, or deals…";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-neutral-200/80 bg-white/95 px-3 backdrop-blur sm:h-16 sm:gap-3 sm:px-6">
      {onOpenMobileNav ? (
        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 md:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </button>
      ) : null}
      <div className="min-w-0 flex-1 md:max-w-md">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-neutral-400 sm:left-3" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q.trim()) {
                if (pathname.startsWith("/deals")) {
                  router.push(`/deals?q=${encodeURIComponent(q.trim())}`);
                } else if (pathname.startsWith("/calendar")) {
                  router.push(`/calendar?q=${encodeURIComponent(q.trim())}`);
                } else if (pathname.startsWith("/payments")) {
                  router.push(`/payments?q=${encodeURIComponent(q.trim())}`);
                } else                 if (pathname.startsWith("/brands")) {
                  router.push(`/brands?q=${encodeURIComponent(q.trim())}`);
                } else if (pathname.startsWith("/billing")) {
                  router.push(`/billing?q=${encodeURIComponent(q.trim())}`);
                } else if (pathname.startsWith("/settings")) {
                  router.push(`/settings?q=${encodeURIComponent(q.trim())}`);
                } else {
                  router.push(`/leads?search=${encodeURIComponent(q.trim())}`);
                }
              }
            }}
            placeholder={searchPlaceholder}
            className="h-9 rounded-full border-neutral-200 bg-[#F3F4F6] pl-8 pr-3 text-sm placeholder:text-neutral-400 sm:h-10 sm:pl-9"
          />
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
        <ModeToggle />
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
          aria-label="Notifications"
        >
          <Bell className="size-[18px]" />
        </button>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
          aria-label="Messages"
        >
          <MessageCircle className="size-[18px]" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-auto max-w-full gap-2 rounded-lg px-2 py-1.5",
            )}
            aria-label="Account menu"
          >
            <Avatar className="size-9 border border-neutral-200">
              <AvatarImage src={avatarUrl ?? undefined} alt="" />
              <AvatarFallback className="bg-indigo-100 text-xs text-[#4F46E5]">
                {initials(name || email)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden min-w-0 text-left sm:block">
              <p className="max-w-[100px] truncate text-sm font-semibold text-neutral-900 lg:max-w-[160px]">
                {name || email.split("@")[0]}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#4F46E5]">Pro creator</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <p className="text-xs text-neutral-500">{email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <User className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={async () => {
                  const supabase = createClient();
                  const { error } = await supabase.auth.signOut();
                  if (error) {
                    toast.error(error.message);
                    return;
                  }
                  router.push("/");
                  router.refresh();
                }}
              >
                <LogOut className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
