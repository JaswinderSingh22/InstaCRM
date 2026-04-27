"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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
import { LogOut, Menu, User } from "lucide-react";
import { toast } from "sonner";

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

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-neutral-200/80 bg-white/95 px-3 backdrop-blur md:h-[4.25rem] md:gap-4 md:px-6">
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
      <div className="min-w-0 flex-1" aria-hidden />
      <div className="flex shrink-0 items-center">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex h-auto max-w-full shrink-0 items-center gap-2.5 rounded-full border border-neutral-200/90 bg-white px-2 py-1.5 text-left shadow-sm outline-none transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[#4F46E5]/30 md:gap-3 md:px-3",
            )}
            aria-label="Account menu"
          >
            <Avatar className="size-9 border border-emerald-700/20 shadow-sm md:size-10">
              <AvatarImage src={avatarUrl ?? undefined} alt="" />
              <AvatarFallback className="bg-emerald-600 text-sm font-semibold text-white">
                {initials(name || email)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden min-w-0 text-left md:block">
              <p className="truncate text-sm font-bold text-neutral-900 md:max-w-[14rem] lg:max-w-[18rem]">
                {name || email.split("@")[0]}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4F46E5]">
                Pro creator
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border border-neutral-200 bg-white p-1.5 text-neutral-900 shadow-xl shadow-neutral-900/10 ring-0"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <p className="text-xs text-neutral-500">{email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-neutral-200" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="text-neutral-800 focus:bg-neutral-100 focus:text-neutral-900"
                onClick={() => router.push("/settings")}
              >
                <User className="mr-2 size-4 text-neutral-600" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-neutral-200" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="text-neutral-800 focus:bg-neutral-100 focus:text-neutral-900"
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
                <LogOut className="mr-2 size-4 text-neutral-600" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
