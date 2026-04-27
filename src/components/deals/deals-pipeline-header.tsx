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
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Deals pipeline</h1>
        <p className="text-sm text-neutral-500">
          Manage your brand partnerships and active campaigns
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <div className="flex -space-x-2 pr-1">
          {TEAM.map((m) => (
            <Avatar
              key={m.id}
              className="size-8 border-2 border-white bg-indigo-100 text-[10px] font-semibold text-[#4F46E5]"
            >
              <AvatarFallback className="bg-indigo-100 text-[#4F46E5]">{m.name}</AvatarFallback>
            </Avatar>
          ))}
          <span className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-neutral-200 text-[10px] font-bold text-neutral-600">
            +12
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-lg border-neutral-200 bg-white text-neutral-700"
          onClick={() => toast.info("Filters coming soon")}
        >
          <Filter className="mr-1.5 size-3.5" />
          Filter
        </Button>
        <Button
          type="button"
          onClick={onAddDeal}
          className="h-9 rounded-full bg-gradient-to-r from-[#4F46E5] to-indigo-600 px-4 font-semibold text-white shadow-md shadow-indigo-500/20"
        >
          <Plus className="mr-1.5 size-4" />
          Add deal
        </Button>
      </div>
    </div>
  );
}
