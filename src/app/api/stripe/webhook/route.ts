import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  if (!endpointSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }
  const body = await request.text();
  const headerList = await headers();
  const sig = headerList.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid event" },
      { status: 400 },
    );
  }

  const supabase = await createServiceRoleClient();

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const { data: ws } = await supabase
      .from("workspaces")
      .update({
        subscription_status: sub.status,
        plan: "pro",
      })
      .eq("stripe_customer_id", customerId)
      .select("id")
      .maybeSingle();
    if (!ws) {
      const wid = sub.metadata?.workspaceId;
      if (wid) {
        await supabase
          .from("workspaces")
          .update({ subscription_status: sub.status, plan: "pro" })
          .eq("id", wid);
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    await supabase
      .from("workspaces")
      .update({ subscription_status: "canceled", plan: null })
      .eq("stripe_customer_id", customerId);
  }

  if (event.type === "invoice.payment_succeeded") {
    const inv = event.data.object as Stripe.Invoice;
    const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
    if (customerId) {
      await supabase
        .from("workspaces")
        .update({ subscription_status: "active" })
        .eq("stripe_customer_id", customerId);
    }
  }

  return NextResponse.json({ received: true });
}
