"use client";

import { Button } from "@/components/ui/button";
import { Filter, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const TEAM = [
  { id: "1", name: "AR" },
  { id: "2", name: "SK" },
  { id: "3", name: "MJ" },
];

type Props = {
  onAddDeal: () => void;
};

export function DealsPipelineHeader({ onAddDeal }: Props) {
  return (
    <div className="mb-4 space-y-4 sm:mb-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Deals pipeline</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your brand partnerships and active campaigns
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:pb-0 [&::-webkit-scrollbar]:hidden">
          <div className="flex shrink-0 -space-x-2 pr-1">
            {TEAM.map((m) => (
              <Avatar
                key={m.id}
                className="size-8 border-2 border-white bg-indigo-100 text-[10px] font-semibold text-[#4F46E5]"
              >
                <AvatarFallback className="bg-indigo-100 text-[#4F46E5]">{m.name}</AvatarFallback>
              </Avatar>
            ))}
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-neutral-200 text-[10px] font-bold text-neutral-600">
              +12
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-lg border-neutral-200 bg-white text-neutral-700 sm:h-9 sm:w-auto"
            onClick={() => toast.info("Filters coming soon")}
          >
            <Filter className="mr-1.5 size-3.5" />
            Filter
          </Button>
          <Button
            type="button"
            onClick={onAddDeal}
            className="h-10 w-full rounded-full bg-gradient-to-r from-[#4F46E5] to-indigo-600 px-4 font-semibold text-white shadow-md shadow-indigo-500/20 sm:h-9 sm:w-auto"
          >
            <Plus className="mr-1.5 size-4" />
            Add deal
          </Button>
        </div>
      </div>
    </div>
  );
}
