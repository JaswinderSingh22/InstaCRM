import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST() {
  const { workspaceId } = await requireWorkspace();
  const supabase = await createClient();
  const { data: ws, error } = await supabase
    .from("workspaces")
    .select("stripe_customer_id")
    .eq("id", workspaceId)
    .single();

  if (error || !ws?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account yet. Start a subscription first." },
      { status: 400 },
    );
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: ws.stripe_customer_id,
    return_url: `${origin}/billing`,
  });
  return NextResponse.json({ url: session.url });
}
