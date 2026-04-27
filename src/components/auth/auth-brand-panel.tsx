"use client";

import { BarChart3, TrendingUp } from "lucide-react";

type Props = { variant: "login" | "signup" };

export function AuthBrandPanel({ variant }: Props) {
  return (
    <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0c1929] via-[#132337] to-[#1a3050] px-6 py-8 text-white md:min-h-dvh md:w-[46%] md:shrink-0 md:px-10 md:py-10 lg:px-14">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48L2c+PC9zdmc+')] opacity-[0.07]" />
      <div className="relative z-10">
        <p className="text-lg font-semibold tracking-tight">InstaCRM</p>
        <h1 className="mt-6 max-w-sm text-3xl font-bold leading-tight tracking-tight md:mt-10 md:text-4xl">
          {variant === "login" ? "Scale your creator empire." : "Build what scales next."}
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80 md:text-base">
          {variant === "login"
            ? "The analytical edge for high-growth influencers and digital entrepreneurs."
            : "Join creators who use InstaCRM to turn leads into long-term brand partnerships."}
        </p>
      </div>
      <div className="relative z-10 mt-8 hidden rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xl backdrop-blur-sm sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
          Real-time performance
        </p>
        <div className="mt-3 flex h-20 items-end justify-between gap-1">
          {["h-7", "h-12", "h-8", "h-14", "h-9", "h-16", "h-11"].map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t bg-gradient-to-t from-[#4F46E5] to-[#0EA5E9] ${h}`}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
          <span className="flex items-center gap-1.5 text-white/70">
            <BarChart3 className="size-3.5" />
            Engagement
          </span>
          <span className="flex items-center gap-1 font-semibold text-emerald-300">
            <TrendingUp className="size-3.5" />
            +24% vs last week
          </span>
        </div>
      </div>
    </div>
  );
}
