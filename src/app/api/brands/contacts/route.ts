import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getWorkspaceContext } from "@/lib/crm/server-workspace";
import type { BrandContactStatus } from "@/types/database";

export const dynamic = "force-dynamic";

function revalidateBrands() {
  revalidatePath("/brands");
}

export async function GET() {
  const c = await getWorkspaceContext();
  if (!c.ok) {
    return NextResponse.json({ error: c.error }, { status: c.status });
  }
  const { data, error } = await c.supabase
    .from("partner_contacts")
    .select("*")
    .eq("workspace_id", c.workspaceId)
    .order("last_contacted_at", { ascending: false, nullsFirst: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ contacts: data });
}

type PostBody = {
  brandId?: string;
  name?: string;
  email?: string | null;
  role?: string | null;
  status?: BrandContactStatus;
};

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
  const brandId = typeof body.brandId === "string" ? body.brandId.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!brandId || !name) {
    return NextResponse.json({ error: "brandId and name are required" }, { status: 400 });
  }
  const { data, error } = await c.supabase
    .from("partner_contacts")
    .insert({
      workspace_id: c.workspaceId,
      brand_id: brandId,
      name,
      email: body.email?.trim() ? body.email.trim() : null,
      role: body.role?.trim() ? body.role.trim() : null,
      status: body.status ?? "active",
    })
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
  revalidateBrands();
  return NextResponse.json({ contact: data }, { status: 201 });
}
