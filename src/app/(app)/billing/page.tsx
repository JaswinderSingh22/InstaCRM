import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { PageFade } from "@/components/layout/page-fade";
import { BillingActions } from "@/components/billing/billing-actions";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const { workspaceId } = await requireWorkspace();
  const supabase = await createClient();
  const { data: ws, error } = await supabase
    .from("workspaces")
    .select("plan, subscription_status")
    .eq("id", workspaceId)
    .single();
  if (error || !ws) {
    return <p className="text-destructive">Could not load workspace</p>;
  }
  return (
    <PageFade>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">Stripe + subscription</p>
      </div>
      <BillingActions
        plan={ws.plan as string | null}
        status={ws.subscription_status as string}
      />
    </PageFade>
  );
}
