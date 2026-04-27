"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { mainNav, moreNav, bottomNav } from "@/config/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarProps = {
  mobileOpen: boolean;
};

export function AppSidebar({ mobileOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-dvh w-[min(17.5rem,88vw)] flex-col border-r border-neutral-200/80 bg-white transition-transform duration-200 ease-out motion-reduce:transition-none sm:w-60",
        "md:z-40 md:translate-x-0",
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0",
      )}
    >
      <div className="border-b border-neutral-100 px-4 py-4">
        <p className="text-base font-bold tracking-tight text-[#4F46E5]">InstaCRM</p>
        <p className="text-[10px] font-semibold tracking-wide text-neutral-500">Creator operations</p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {mainNav.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link key={`${item.href}-${item.label}`} href={item.href} className="block">
              <div
                className={cn(
                  "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-[#4F46E5]"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                )}
              >
                {active ? (
                  <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-[#4F46E5]" />
                ) : null}
                <Icon className={cn("size-4 shrink-0", active && "text-[#4F46E5]")} />
                {item.label}
              </div>
            </Link>
          );
        })}

        <div className="my-3 border-t border-neutral-100 pt-2">
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            More
          </p>
          {moreNav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-indigo-50 text-[#4F46E5]"
                      : "text-neutral-600 hover:bg-neutral-50",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-neutral-100 p-3">
        <div className="space-y-0.5">
          {bottomNav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-neutral-600 hover:bg-neutral-50",
                    active && "text-[#4F46E5]",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
          <Link
            href="/help"
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            <HelpCircle className="size-4" />
            Help
          </Link>
        </div>
      </div>
    </aside>
  );
}
