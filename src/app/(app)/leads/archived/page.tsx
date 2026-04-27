import Link from "next/link";
import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { PageFade } from "@/components/layout/page-fade";
import type { Lead } from "@/types/database";
import { LeadsArchivedTable } from "@/components/leads/leads-archived-table";

export const metadata = { title: "Archived leads" };

export default async function ArchivedLeadsPage() {
  const { workspaceId } = await requireWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", workspaceId)
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  if (error) {
    return <p className="text-sm text-destructive">Could not load archived leads</p>;
  }

  const leads = (data ?? []) as Lead[];

  return (
    <PageFade>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link href="/leads" className="text-sm font-medium text-[#4F46E5] hover:underline">
            ← Back to Creators
          </Link>
          <h1 className="mt-3 font-serif text-2xl font-bold tracking-tight text-neutral-900">
            Archived leads
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Restore a lead to bring it back to your active pipeline.
          </p>
        </div>
        <LeadsArchivedTable leads={leads} />
      </div>
    </PageFade>
  );
}
