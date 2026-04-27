import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getWorkspaceContext } from "@/lib/crm/server-workspace";
import type { TaskRelated } from "@/types/database";

export const dynamic = "force-dynamic";

function revalidateTaskRoutes() {
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

/**
 * List tasks for the signed-in user’s default workspace.
 * Auth: Supabase session cookie (same as server actions).
 */
export async function GET() {
  const c = await getWorkspaceContext();
  if (!c.ok) {
    return NextResponse.json({ error: c.error }, { status: c.status });
  }
  const { data, error } = await c.supabase
    .from("tasks")
    .select("*")
    .eq("workspace_id", c.workspaceId)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ tasks: data });
}

type PostBody = {
  title?: string;
  dueAt?: string | null;
  reminderAt?: string | null;
  description?: string | null;
  relatedType?: TaskRelated;
  relatedId?: string | null;
};

/**
 * Create a task (JSON body). Mirrors `createTask` server action.
 */
export async function POST(request: Request) {
  const c = await getWorkspaceContext();
  if (!c.ok) {
    return NextResponse.json({ error: c.error }, { status: c.status });
  }
  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const relatedType: TaskRelated | null =
    body.relatedType && body.relatedType !== "none" ? body.relatedType : null;
  const { data, error } = await c.supabase
    .from("tasks")
    .insert({
      workspace_id: c.workspaceId,
      title,
      description: body.description?.trim() ? body.description.trim() : null,
      due_at: body.dueAt ?? null,
      reminder_at: body.reminderAt ?? null,
      related_type: relatedType,
      related_id: body.relatedId ?? null,
    })
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
  revalidateTaskRoutes();
  return NextResponse.json({ task: data }, { status: 201 });
}
