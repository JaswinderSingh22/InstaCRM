import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { stripe, STRIPEPriceMap } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST() {
  const { workspaceId, user } = await requireWorkspace();
  if (!STRIPEPriceMap.pro) {
    return NextResponse.json(
      { error: "STRIPE_PRICE_ID_PRO is not set" },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const { data: ws } = await supabase
    .from("workspaces")
    .select("id, name, stripe_customer_id")
    .eq("id", workspaceId)
    .single();

  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let customerId = ws.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: (user.user_metadata as { full_name?: string })?.full_name,
      metadata: { workspaceId: workspaceId, userId: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("workspaces")
      .update({ stripe_customer_id: customerId })
      .eq("id", workspaceId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: STRIPEPriceMap.pro, quantity: 1 }],
    success_url: `${origin}/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/billing?canceled=1`,
    metadata: { workspaceId, userId: user.id },
    subscription_data: { metadata: { workspaceId, userId: user.id } },
  });

  if (!session.url) {
    return NextResponse.json({ error: "No checkout url" }, { status: 500 });
  }
  return NextResponse.json({ url: session.url });
}
