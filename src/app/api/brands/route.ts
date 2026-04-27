import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/crm/server-workspace";

export const dynamic = "force-dynamic";

/**
 * List brands for the signed-in user’s default workspace.
 */
export async function GET() {
  const c = await getWorkspaceContext();
  if (!c.ok) {
    return NextResponse.json({ error: c.error }, { status: c.status });
  }
  const { data, error } = await c.supabase
    .from("brands")
    .select("*")
    .eq("workspace_id", c.workspaceId)
    .order("name");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ brands: data });
}
