import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getWorkspaceContext } from "@/lib/crm/server-workspace";
import type { BrandContactStatus } from "@/types/database";

export const dynamic = "force-dynamic";

function revalidateBrands() {
  revalidatePath("/brands");
}

type PatchBody = Partial<{
  name: string;
  email: string | null;
  role: string | null;
  status: BrandContactStatus;
  last_contacted_at: string | null;
}>;

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const c = await getWorkspaceContext();
  if (!c.ok) {
    return NextResponse.json({ error: c.error }, { status: c.status });
  }
  const { id } = await ctx.params;
  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { data, error } = await c.supabase
    .from("partner_contacts")
    .update(body)
    .eq("id", id)
    .eq("workspace_id", c.workspaceId)
    .select("*")
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  revalidateBrands();
  return NextResponse.json({ contact: data });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const c = await getWorkspaceContext();
  if (!c.ok) {
    return NextResponse.json({ error: c.error }, { status: c.status });
  }
  const { id } = await ctx.params;
  const { error } = await c.supabase
    .from("partner_contacts")
    .delete()
    .eq("id", id)
    .eq("workspace_id", c.workspaceId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidateBrands();
  return NextResponse.json({ ok: true });
}
