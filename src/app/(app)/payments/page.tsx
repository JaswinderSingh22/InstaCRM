import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { PaymentForm, PaymentsTable } from "@/components/payments/payment-section";
import { PageFade } from "@/components/layout/page-fade";
import type { Payment } from "@/types/database";

export const metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const { workspaceId } = await requireWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) {
    return <p className="text-destructive">Could not load</p>;
  }
  const rows = (data ?? []) as Payment[];
  return (
    <PageFade>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">Revenue and receivables</p>
        </div>
        <PaymentForm />
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payment rows</p>
      ) : (
        <PaymentsTable rows={rows} />
      )}
    </PageFade>
  );
}
