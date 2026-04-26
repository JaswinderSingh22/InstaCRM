"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { mainNav } from "@/config/nav";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-dvh w-60 flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2 border-b border-border/60 px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="size-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">InstaCRM</p>
          <p className="text-[10px] text-muted-foreground">Revenue OS</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {mainNav.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="block">
              <motion.div
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("size-4 shrink-0", active && "text-primary")}
                />
                {item.label}
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
