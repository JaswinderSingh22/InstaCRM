import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { LeadForm } from "@/components/leads/lead-form";
import { LeadsTable } from "@/components/leads/leads-table";
import { PageFade } from "@/components/layout/page-fade";
import type { Lead } from "@/types/database";

export const metadata = { title: "Leads" };

export default async function LeadsPage() {
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
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Track every conversation</p>
        </div>
        <LeadForm />
      </div>
      {leads.length === 0 ? (
        <p className="text-sm text-muted-foreground">No leads yet. Create one above.</p>
      ) : (
        <LeadsTable leads={leads} />
      )}
    </PageFade>
  );
}
