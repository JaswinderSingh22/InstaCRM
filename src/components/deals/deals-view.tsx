"use client";

import { useState } from "react";
import { DealsKanban } from "@/components/deals/deals-kanban";
import { DealsPipelineHeader } from "@/components/deals/deals-pipeline-header";
import { AddDealModal } from "@/components/deals/add-deal-modal";
import type { Deal, DealStage } from "@/types/database";

export type DealsSummary = {
  openCount: number;
  pipelineValueCents: number;
  totalDeals: number;
};

type Props = {
  initial: Deal[];
  summary: DealsSummary;
  workspaceDefaultCurrency: string;
};

export function DealsView({ initial, summary, workspaceDefaultCurrency }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [addStage, setAddStage] = useState<DealStage>("lead");
  const [editDeal, setEditDeal] = useState<Deal | null>(null);

  const openAdd = (stage: DealStage) => {
    setEditDeal(null);
    setAddStage(stage);
    setAddOpen(true);
  };

  const handleDealModalOpen = (open: boolean) => {
    setAddOpen(open);
    if (!open) setEditDeal(null);
  };

  return (
    <div className="relative min-h-[60vh] pb-6">
      <DealsPipelineHeader
        summary={summary}
        onAddDeal={() => openAdd("lead")}
        workspaceDefaultCurrency={workspaceDefaultCurrency}
      />
      <DealsKanban
        initial={initial}
        onAddDeal={openAdd}
        onEditDeal={(d) => {
          setEditDeal(d);
          setAddStage(d.stage);
          setAddOpen(true);
        }}
      />
      <AddDealModal
        open={addOpen}
        onOpenChange={handleDealModalOpen}
        defaultStage={addStage}
        defaultCurrency={workspaceDefaultCurrency}
        initialDeal={editDeal}
      />
    </div>
  );
}
