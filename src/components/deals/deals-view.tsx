"use client";

import { useState } from "react";
import { DealsKanban } from "@/components/deals/deals-kanban";
import { DealsPipelineHeader } from "@/components/deals/deals-pipeline-header";
import { AddDealModal } from "@/components/deals/add-deal-modal";
import { DealsPipelineFab } from "@/components/deals/deals-pipeline-fab";
import type { Deal, DealStage } from "@/types/database";

type Props = {
  initial: Deal[];
};

export function DealsView({ initial }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [addStage, setAddStage] = useState<DealStage>("lead");

  const openAdd = (stage: DealStage) => {
    setAddStage(stage);
    setAddOpen(true);
  };

  return (
    <div className="relative min-h-[60vh]">
      <DealsPipelineHeader onAddDeal={() => openAdd("lead")} />
      <DealsKanban initial={initial} onAddDeal={openAdd} />
      <AddDealModal open={addOpen} onOpenChange={setAddOpen} defaultStage={addStage} />
      <DealsPipelineFab onClick={() => openAdd("lead")} />
    </div>
  );
}
