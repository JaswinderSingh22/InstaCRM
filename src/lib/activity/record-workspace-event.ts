import type { SupabaseClient } from "@supabase/supabase-js";

export const WORKSPACE_ACTIVITY_EVENT_TYPES = [
  "lead_created",
  "lead_status_changed",
  "lead_archived",
  "lead_restored",
  "brand_created",
  "deal_created",
  "deal_stage_changed",
  "payment_created",
  "payment_received",
  "campaign_created",
  "campaign_status_changed",
  "task_completed",
  "brand_touchpoint",
] as const;

export type WorkspaceActivityEventType = (typeof WORKSPACE_ACTIVITY_EVENT_TYPES)[number];

/** Best-effort insert; does not throw (feed must not block CRM writes). */
export async function recordWorkspaceActivity(
  supabase: SupabaseClient,
  p: {
    workspaceId: string;
    actorId: string;
    eventType: WorkspaceActivityEventType;
    title: string;
    summary?: string | null;
    entityType?: string | null;
    entityId?: string | null;
  },
): Promise<void> {
  try {
    const { error } = await supabase.from("workspace_activity_events").insert({
      workspace_id: p.workspaceId,
      actor_id: p.actorId,
      event_type: p.eventType,
      title: p.title.slice(0, 500),
      summary: p.summary ? p.summary.slice(0, 2000) : null,
      entity_type: p.entityType ?? null,
      entity_id: p.entityId ?? null,
    });
    if (error) {
      console.error("workspace_activity_events:", error.message);
    }
  } catch (e) {
    console.error("recordWorkspaceActivity", e);
  }
}
