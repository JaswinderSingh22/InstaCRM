"use client";

import { Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onClick: () => void;
};

export function DealsPipelineFab({ onClick }: Props) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full border-0 bg-gradient-to-br from-[#4F46E5] to-indigo-600 p-0 text-white shadow-xl shadow-indigo-500/30 hover:from-[#4338ca] hover:to-indigo-600"
      aria-label="Add deal"
    >
      <Handshake className="size-6" />
    </Button>
  );
}
