import { FeatureCard } from "@/components/marketing/feature-card";
import { BarChart3, FileText, Handshake, UserRound } from "lucide-react";

function LeadListGraphic() {
  return (
    <div className="mt-2 rounded-xl border border-neutral-200/60 bg-white p-3 text-[10px] sm:text-xs">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
            G
          </span>
          <div>
            <div className="h-1.5 w-20 rounded bg-neutral-200" />
            <div className="mt-0.5 h-1 w-12 rounded bg-neutral-100" />
          </div>
        </div>
        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
          HOT
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-800">
          N
        </span>
        <div>
          <div className="h-1.5 w-16 rounded bg-neutral-200" />
          <div className="mt-0.5 h-1 w-10 rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

function AnalyticsGraphic() {
  return (
    <div className="mt-2 rounded-xl border border-neutral-200 bg-gradient-to-b from-neutral-800 to-neutral-900 p-3 text-left text-white">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
        Analytics
      </p>
      <div className="mt-2 flex h-16 items-end gap-0.5">
        {[
          30, 45, 40, 60, 55, 70, 65, 80, 75, 90, 85, 95, 100, 80, 70,
        ].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-cyan-400/90"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-1 h-px w-full bg-white/20" />
      <div className="mt-1 h-2 w-3/4 rounded bg-white/20" />
    </div>
  );
}

export function FeaturesBento() {
  return (
    <div
      id="features"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5"
    >
      <FeatureCard
        className="lg:col-span-2"
        title="Smart Lead Tracking"
        description="Never lose a prospect again. Our CRM automatically pulls brand contacts from your emails and Instagram inquiries into a unified pipeline."
        icon={UserRound}
        variant="default"
      >
        <div className="sm:flex sm:justify-end">
          <div className="w-full sm:max-w-[200px]">
            <LeadListGraphic />
          </div>
        </div>
      </FeatureCard>

      <FeatureCard
        className="lg:col-span-1"
        title="Instant Invoicing"
        description="Send professional invoices in 2 clicks. Get paid via Stripe with automatic follow-ups for late payments."
        icon={FileText}
        variant="primary"
      />

      <FeatureCard
        className="lg:col-span-1"
        title="Deal Pipeline"
        description="Visual Kanban boards to track every stage of your brand collaboration from pitch to posting."
        icon={Handshake}
        variant="soft"
      />

      <FeatureCard
        className="lg:col-span-2"
        title="Creator Analytics"
        description="Real-time data visualization showing your engagement rate, follower growth, and campaign performance ROI for brands."
        icon={BarChart3}
        variant="default"
      >
        <div className="sm:flex sm:justify-end">
          <div className="w-full sm:max-w-[220px]">
            <AnalyticsGraphic />
          </div>
        </div>
      </FeatureCard>
    </div>
  );
}
