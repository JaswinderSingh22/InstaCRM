import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { LeadsManagementView } from "@/components/leads/leads-management-view";
import { PageFade } from "@/components/layout/page-fade";
import type { Lead } from "@/types/database";
import { getLeadsPageInsights } from "@/lib/data/leads-page-insights";

export const metadata = { title: "Leads Management" };

type Props = {
  searchParams: Promise<{ search?: string }>;
};

export default async function LeadsPage({ searchParams }: Props) {
  const p = await searchParams;
  const initialQuery = typeof p.search === "string" ? p.search : "";
  const { workspaceId, profile } = await requireWorkspace();
  const supabase = await createClient();

  const [leadsRes, insights, archivedRes] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    getLeadsPageInsights(workspaceId),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .not("archived_at", "is", null),
  ]);

  if (leadsRes.error) {
    return <p className="text-sm text-destructive">Could not load leads</p>;
  }

  const leads = (leadsRes.data ?? []) as Lead[];
  const archivedCount = archivedRes.count ?? 0;

  return (
    <PageFade>
      <LeadsManagementView
        leads={leads}
        initialQuery={initialQuery}
        insights={insights}
        archivedCount={archivedCount}
        workspaceDefaultCurrency={profile.workspace_default_currency}
      />
    </PageFade>
  );
}
