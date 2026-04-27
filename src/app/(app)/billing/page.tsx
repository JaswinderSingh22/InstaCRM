import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { PageFade } from "@/components/layout/page-fade";
import { BillingPageView } from "@/components/billing/billing-page-view";

export const metadata = { title: "Billing & Subscriptions" };

export default async function BillingPage() {
  const { workspaceId } = await requireWorkspace();
  const supabase = await createClient();

  const [{ data: ws, error }, { count: leadCount }] = await Promise.all([
    supabase.from("workspaces").select("plan, subscription_status").eq("id", workspaceId).single(),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
  ]);

  if (error || !ws) {
    return <p className="text-destructive">Could not load workspace</p>;
  }

  return (
    <PageFade>
      <BillingPageView
        plan={ws.plan as string | null}
        subscriptionStatus={ws.subscription_status as string}
        leadCount={leadCount ?? 0}
      />
    </PageFade>
  );
}
