"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { DealsSummary } from "@/components/deals/deals-view";

type Props = {
  summary: DealsSummary;
  onAddDeal: () => void;
  workspaceDefaultCurrency: string;
};

export function DealsPipelineHeader({ summary, onAddDeal, workspaceDefaultCurrency }: Props) {
  return (
    <div className="mb-4 space-y-3 sm:mb-6 sm:space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Deals pipeline</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your brand partnerships and active campaigns
          </p>
          <p className="mt-2 text-xs text-neutral-600 sm:text-sm">
            <span className="font-semibold text-neutral-800">{summary.openCount}</span> open in pipeline
            {summary.openCount > 0 ? (
              <>
                {" "}
                ·{" "}
                <span className="font-semibold tabular-nums text-neutral-800">
                  {formatMoney(summary.pipelineValueCents, workspaceDefaultCurrency)}
                </span>{" "}
                total value
              </>
            ) : null}
            {summary.totalDeals > summary.openCount ? (
              <span className="text-neutral-400">
                {" "}
                · {summary.totalDeals - summary.openCount} closed
              </span>
            ) : null}
          </p>
        </div>
        <Button
          type="button"
          onClick={onAddDeal}
          className="h-10 w-full shrink-0 rounded-full bg-gradient-to-r from-[#4F46E5] to-indigo-600 px-4 font-semibold text-white shadow-md shadow-indigo-500/20 sm:h-9 sm:w-auto"
        >
          <Plus className="mr-1.5 size-4" />
          Add deal
        </Button>
      </div>
    </div>
  );
}
