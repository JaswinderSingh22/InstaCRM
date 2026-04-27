"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Lead } from "@/types/database";
import { restoreLead } from "@/app/actions/crm";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LeadsArchivedTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200/80 bg-white py-14 text-center text-sm text-neutral-500 shadow-sm">
        No archived leads.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm">
      <ul className="divide-y divide-neutral-100">
        {leads.map((l) => (
          <li key={l.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-neutral-900">{l.company?.trim() || l.name}</p>
              <p className="text-sm text-neutral-600">{l.name}</p>
              {l.archived_at ? (
                <p className="mt-1 text-xs text-neutral-400">
                  Archived {new Date(l.archived_at).toLocaleDateString()}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 shrink-0 rounded-lg")}
              onClick={async () => {
                try {
                  await restoreLead(l.id);
                  toast.success("Lead restored");
                  router.refresh();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Error");
                }
              }}
            >
              Restore to pipeline
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
