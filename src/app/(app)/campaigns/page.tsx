import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { PageFade } from "@/components/layout/page-fade";
import { CampaignsView } from "@/components/campaigns/campaigns-view";
import type { Campaign } from "@/types/database";

export const metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  const { workspaceId, profile } = await requireWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("status")
    .order("position", { ascending: true });

  if (error) {
    return (
      <PageFade>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Campaigns need a database migration</p>
          <p className="mt-1 text-amber-800">
            Run <code className="rounded bg-white/80 px-1">supabase db push</code> or apply{" "}
            <code className="rounded bg-white/80 px-1">20260428170000_campaigns.sql</code> in the SQL editor, then
            refresh.
          </p>
          <p className="mt-2 text-xs text-amber-700/90">{error.message}</p>
        </div>
      </PageFade>
    );
  }

  const initial = (data ?? []) as Campaign[];
  const key = initial.map((c) => `${c.id}-${c.status}-${c.position}`).join("|");

  return (
    <PageFade>
      <CampaignsView
        key={key}
        initial={initial}
        workspaceDefaultCurrency={profile.workspace_default_currency}
      />
    </PageFade>
  );
}
