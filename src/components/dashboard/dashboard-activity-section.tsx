import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Archive,
  Briefcase,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  LayoutList,
  Mail,
  Megaphone,
  RotateCcw,
  User2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceActivityEvent } from "@/types/database";

type Props = {
  activities: WorkspaceActivityEvent[];
  /** When set, card header links here for “view all”. */
  viewAllHref?: string;
};

function iconForEvent(eventType: string) {
  switch (eventType) {
    case "lead_created":
    case "lead_status_changed":
      return User2;
    case "lead_archived":
      return Archive;
    case "lead_restored":
      return RotateCcw;
    case "brand_created":
      return Building2;
    case "deal_created":
    case "deal_stage_changed":
      return Briefcase;
    case "payment_created":
    case "payment_received":
      return CircleDollarSign;
    case "campaign_created":
    case "campaign_status_changed":
      return Megaphone;
    case "task_completed":
      return CheckCircle2;
    case "brand_touchpoint":
      return Mail;
    default:
      return LayoutList;
  }
}

function iconRing(eventType: string) {
  switch (eventType) {
    case "lead_created":
    case "lead_status_changed":
      return "bg-orange-100 text-orange-600";
    case "lead_archived":
      return "bg-neutral-200 text-neutral-700";
    case "lead_restored":
      return "bg-emerald-100 text-emerald-700";
    case "brand_created":
      return "bg-amber-100 text-amber-700";
    case "deal_created":
    case "deal_stage_changed":
      return "bg-sky-100 text-sky-600";
    case "payment_created":
    case "payment_received":
      return "bg-emerald-100 text-emerald-600";
    case "campaign_created":
    case "campaign_status_changed":
      return "bg-violet-100 text-violet-600";
    case "task_completed":
      return "bg-teal-100 text-teal-700";
    case "brand_touchpoint":
      return "bg-indigo-100 text-indigo-600";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

function entityHref(entityType: string | null): string {
  switch (entityType) {
    case "lead":
      return "/leads";
    case "deal":
      return "/deals";
    case "campaign":
      return "/campaigns";
    case "payment":
      return "/payments";
    case "task":
      return "/calendar";
    case "brand":
      return "/brands";
    default:
      return "/dashboard";
  }
}

export function DashboardActivitySection({ activities, viewAllHref = "/dashboard" }: Props) {
  const slice = activities.slice(0, 8);

  const shell = "rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm";

  return (
    <div className={shell}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">Activity feed</h3>
        <Link href={viewAllHref} className="text-xs font-medium text-[#4F46E5] hover:underline">
          View all
        </Link>
      </div>
      {slice.length === 0 ? (
        <p className="text-sm leading-relaxed text-neutral-500">
          No activity yet. Add a lead, campaign, deal, or invoice — your workspace timeline will show up here.
        </p>
      ) : (
        <ul className="space-y-3">
          {slice.map((it) => {
            const Icon = iconForEvent(it.event_type);
            const href = entityHref(it.entity_type);
            const inner = (
              <>
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    iconRing(it.event_type),
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-neutral-800">{it.title}</p>
                  {it.summary ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{it.summary}</p>
                  ) : null}
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                    {formatDistanceToNow(new Date(it.created_at), { addSuffix: true })}
                  </p>
                </div>
              </>
            );
            return (
              <li key={it.id}>
                <Link
                  href={href}
                  className="-mx-1 flex gap-3 rounded-lg px-1 py-0.5 transition hover:bg-neutral-50"
                >
                  {inner}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
