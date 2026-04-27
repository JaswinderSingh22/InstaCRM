import { BarChart3, Inbox, LayoutDashboard, Settings, Users } from "lucide-react";

export function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div
        className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-2xl shadow-indigo-500/10 ring-1 ring-black/5"
        style={{ aspectRatio: "16/10" }}
      >
        <div className="flex h-full min-h-[280px] text-xs sm:text-sm">
          <aside className="flex w-12 flex-col items-center gap-2 border-r border-neutral-100 bg-neutral-50/80 py-3 sm:w-16 sm:gap-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-100 text-[#4F46E5] sm:size-8">
              <LayoutDashboard className="size-4" />
            </div>
            <Inbox className="size-4 text-neutral-400" />
            <Users className="size-4 text-neutral-400" />
            <BarChart3 className="size-4 text-neutral-400" />
            <Settings className="mt-auto size-4 text-neutral-400" />
          </aside>
          <div className="min-w-0 flex-1 p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-neutral-800">Revenue & pipeline</span>
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 sm:text-xs">
                +12.4%
              </span>
            </div>
            <div className="grid h-24 grid-cols-12 items-end gap-0.5 sm:h-32">
              {[
                40, 55, 45, 70, 50, 80, 60, 90, 75, 85, 95, 70, 60, 88, 100,
              ].map((h, i) => (
                <div
                  key={i}
                  className="col-span-1 rounded-t bg-gradient-to-t from-indigo-200 to-cyan-400/90"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-3 h-20 rounded-lg bg-gradient-to-b from-neutral-100 to-white sm:h-24" />
          </div>
          <div className="hidden w-36 flex-col border-l border-neutral-100 bg-neutral-50/50 p-2 sm:flex lg:w-44">
            <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
              Recent revenue
            </p>
            <p className="mt-1 text-lg font-bold text-neutral-900">$12,450.00</p>
            <p className="text-[10px] text-emerald-600">↑ vs last week</p>
            <div className="mt-2 flex-1 rounded-md bg-white/80 p-2 shadow-sm">
              <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200">
                <div className="h-full w-3/4 rounded-full bg-indigo-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
