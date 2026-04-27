"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Campaign, CampaignStatus } from "@/types/database";
import { CampaignsKanban } from "@/components/campaigns/campaigns-kanban";
import { AddCampaignModal } from "@/components/campaigns/add-campaign-modal";

type Props = {
  initial: Campaign[];
  workspaceDefaultCurrency: string;
};

export function CampaignsView({ initial, workspaceDefaultCurrency }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [addStatus, setAddStatus] = useState<CampaignStatus>("inbox");

  const openAdd = (status: CampaignStatus) => {
    setAddStatus(status);
    setAddOpen(true);
  };

  return (
    <div className="relative min-h-[60vh] pb-6">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Campaigns</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Capture briefs from WhatsApp, track apply → post → paid in one board. Drag cards to update your stage.
            Moving to <strong className="font-medium text-neutral-700">Applied</strong>,{" "}
            <strong className="font-medium text-neutral-700">In progress</strong>, or{" "}
            <strong className="font-medium text-neutral-700">Done</strong> auto-creates Creators/Brands rows and
            calendar tasks when needed.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => openAdd("inbox")}
          className="h-10 w-full shrink-0 rounded-full bg-gradient-to-r from-[#4F46E5] to-indigo-600 px-4 font-semibold text-white shadow-md shadow-indigo-500/20 sm:h-9 sm:w-auto"
        >
          <Plus className="mr-1.5 size-4" />
          New campaign
        </Button>
      </div>

      <CampaignsKanban initial={initial} onAddCampaign={openAdd} />
      <AddCampaignModal
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultStatus={addStatus}
        defaultCurrency={workspaceDefaultCurrency}
      />
    </div>
  );
}
