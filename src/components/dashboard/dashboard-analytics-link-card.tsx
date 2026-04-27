import Link from "next/link";
import { BarChart3, ChevronRight } from "lucide-react";

export function DashboardAnalyticsLinkCard() {
  return (
    <Link
      href="/analytics"
      className="group flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition hover:border-[#4F46E5]/35 hover:shadow-md hover:ring-1 hover:ring-[#4F46E5]/15"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Analytics</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Revenue trends, funnel, and workspace metrics in detail.
          </p>
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[#4F46E5]">
          <BarChart3 className="size-5" strokeWidth={2} />
        </div>
      </div>
      <p className="mt-4 flex items-center text-xs font-semibold text-[#4F46E5]">
        Open analytics
        <ChevronRight className="ml-0.5 size-4 transition group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}
