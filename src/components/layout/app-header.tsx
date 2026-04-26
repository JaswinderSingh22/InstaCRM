"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";

type Props = {
  email: string;
  name: string;
  avatarUrl: string | null;
};

function initials(n: string) {
  if (!n.trim()) return "?";
  const p = n.split(/\s+/).filter(Boolean);
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0]! + p[1]![0]!).toUpperCase();
}

export function AppHeader({ email, name, avatarUrl }: Props) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-2 border-b border-border/60 bg-background/70 px-4 backdrop-blur-md">
      <ModeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-8 gap-2 rounded-md px-2",
          )}
          aria-label="Account menu"
        >
          <Avatar className="size-7 border border-border/60">
            <AvatarImage src={avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="text-xs">
              {initials(name || email)}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[140px] truncate text-sm font-medium sm:inline">
            {name || email}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs text-muted-foreground">{email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <User className="mr-2 size-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
