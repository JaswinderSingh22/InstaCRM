import { createClient } from "@/lib/supabase/server";
import type { WorkspaceActivityEvent } from "@/types/database";

export async function getWorkspaceActivityFeed(
  workspaceId: string,
  limit = 30,
): Promise<WorkspaceActivityEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_activity_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("activity feed:", error.message);
    return [];
  }
  return (data ?? []) as WorkspaceActivityEvent[];
}
