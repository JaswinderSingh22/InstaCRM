import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/crm/server-workspace";
import { getWorkspaceActivityFeed } from "@/lib/data/activity-feed";

/**
 * GET /api/activity — recent workspace activity for the signed-in user.
 * For live UI updates, poll this route or refresh the page; optional: subscribe to
 * `workspace_activity_events` via Supabase Realtime on the client.
 */
export async function GET(request: Request) {
  const c = await getWorkspaceContext();
  if (!c.ok) {
    return NextResponse.json({ error: c.error }, { status: c.status });
  }
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 40));
  const items = await getWorkspaceActivityFeed(c.workspaceId, limit);
  return NextResponse.json({ items });
}
