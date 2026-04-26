import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { DealsKanban } from "@/components/deals/deals-kanban";
import { PageFade } from "@/components/layout/page-fade";
import type { Deal } from "@/types/database";

export const metadata = { title: "Deals" };

export default async function DealsPage() {
  const { workspaceId } = await requireWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("workspace_id", workspaceId);
  if (error) {
    return <p className="text-sm text-destructive">Could not load deals</p>;
  }
  const initial = (data ?? []) as Deal[];
  const key = initial.map((d) => `${d.id}-${d.stage}-${d.position}`).join("|");
  return (
    <PageFade>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Deals</h1>
        <p className="text-sm text-muted-foreground">Drag between stages</p>
      </div>
      <DealsKanban key={key} initial={initial} />
    </PageFade>
  );
}
