import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getWorkspaceContext } from "@/lib/crm/server-workspace";

export const dynamic = "force-dynamic";

function revalidateTaskRoutes() {
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

type Ctx = { params: Promise<{ id: string }> };

/**
 * Update a task (JSON body: partial fields). RLS enforces workspace ownership.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  const c = await getWorkspaceContext();
  if (!c.ok) {
    return NextResponse.json({ error: c.error }, { status: c.status });
  }
  const { id: rawId } = await params;
  if (!rawId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const allowed: Record<string, unknown> = {};
  if ("title" in body && typeof body.title === "string") allowed.title = body.title;
  if ("completed" in body && typeof body.completed === "boolean")
    allowed.completed = body.completed;
  if ("due_at" in body && (body.due_at === null || typeof body.due_at === "string")) {
    allowed.due_at = body.due_at;
  }
  if (
    "reminder_at" in body &&
    (body.reminder_at === null || typeof body.reminder_at === "string")
  ) {
    allowed.reminder_at = body.reminder_at;
  }
  if (
    "description" in body &&
    (body.description === null || typeof body.description === "string")
  ) {
    allowed.description = body.description;
  }
  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }
  const { data, error } = await c.supabase
    .from("tasks")
    .update(allowed)
    .eq("id", rawId)
    .eq("workspace_id", c.workspaceId)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  revalidateTaskRoutes();
  return NextResponse.json({ task: data });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const c = await getWorkspaceContext();
  if (!c.ok) {
    return NextResponse.json({ error: c.error }, { status: c.status });
  }
  const { id: rawId } = await params;
  if (!rawId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const { data, error } = await c.supabase
    .from("tasks")
    .delete()
    .eq("id", rawId)
    .eq("workspace_id", c.workspaceId)
    .select("id")
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  revalidateTaskRoutes();
  return new NextResponse(null, { status: 204 });
}
