"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCcw } from "lucide-react";
import { ensureUserWorkspace } from "@/app/actions/ensure-workspace";
import { Button } from "@/components/ui/button";

type Props = {
  lastError: string;
};

export function OnboardingProvisioning({ lastError }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(lastError);

  const retry = async () => {
    setIsPending(true);
    setError("…");
    const r = await ensureUserWorkspace();
    if (r.ok) {
      router.refresh();
    } else {
      setError(r.error);
    }
    setIsPending(false);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#F4F5FA] px-6 text-center">
      <Loader2 className="size-8 animate-spin text-[#4F46E5]" />
      <p className="text-sm font-medium text-neutral-800">Setting up your workspace</p>
      <p className="max-w-md text-xs text-red-600/90">{error}</p>
      <p className="max-w-sm text-xs text-[#777681]">
        If you just signed in with Google, the database may need one migration applied (see project README) or
        try again in a few seconds.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={retry}
        disabled={isPending}
        className="gap-2"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
        Try again
      </Button>
    </div>
  );
}
