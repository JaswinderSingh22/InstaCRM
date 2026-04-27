import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { LeadsManagementView } from "@/components/leads/leads-management-view";
import { PageFade } from "@/components/layout/page-fade";
import type { Lead } from "@/types/database";

export const metadata = { title: "Leads Management" };

type Props = {
  searchParams: Promise<{ search?: string }>;
};

export default async function LeadsPage({ searchParams }: Props) {
  const p = await searchParams;
  const initialQuery = typeof p.search === "string" ? p.search : "";
  const { workspaceId } = await requireWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) {
    return <p className="text-sm text-destructive">Could not load leads</p>;
  }
  const leads = (data ?? []) as Lead[];
  return (
    <PageFade>
      <LeadsManagementView leads={leads} initialQuery={initialQuery} />
    </PageFade>
  );
}
