import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getWorkspaceContext } from "@/lib/crm/server-workspace";
import type { BrandActivityKind } from "@/types/database";

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
    .from("relationship_events")
    .select("*")
    .eq("workspace_id", c.workspaceId)
    .order("occurred_at", { ascending: false })
    .limit(100);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ events: data });
}

type PostBody = {
  brandId?: string;
  kind?: BrandActivityKind;
  title?: string;
  body?: string | null;
  amountCents?: number | null;
  occurredAt?: string | null;
};

const KINDS: BrandActivityKind[] = ["email", "payment", "contract", "meeting", "note"];

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
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const kind = body.kind;
  if (!brandId || !title || !kind || !KINDS.includes(kind)) {
    return NextResponse.json(
      { error: "brandId, title, and a valid kind are required" },
      { status: 400 },
    );
  }
  const { data, error } = await c.supabase
    .from("relationship_events")
    .insert({
      workspace_id: c.workspaceId,
      brand_id: brandId,
      kind,
      title,
      body: body.body?.trim() ? body.body.trim() : null,
      amount_cents: body.amountCents ?? null,
      occurred_at: body.occurredAt ?? new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
  revalidateBrands();
  return NextResponse.json({ event: data }, { status: 201 });
}
