import { Suspense } from "react";
import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { PaymentsFinanceView } from "@/components/payments/payments-finance-view";
import type { Payment } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "Payments & Invoicing" };

type Props = { searchParams: Promise<{ q?: string }> };

function FinanceLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-4 p-1">
      <div className="h-8 w-64 rounded bg-neutral-200" />
      <div className="h-24 grid grid-cols-3 gap-3">
        <div className="h-full rounded-2xl bg-neutral-100" />
        <div className="h-full rounded-2xl bg-neutral-100" />
        <div className="h-full rounded-2xl bg-neutral-100" />
      </div>
      <div className="h-64 rounded-2xl bg-neutral-100" />
    </div>
  );
}

export default async function PaymentsPage({ searchParams }: Props) {
  const p = await searchParams;
  const initialQuery = typeof p.q === "string" ? p.q : "";
  const { workspaceId } = await requireWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) {
    return <p className="text-destructive">Could not load payments</p>;
  }
  const rows = (data ?? []) as Payment[];

  return (
    <Suspense fallback={<FinanceLoading />}>
      <PaymentsFinanceView rows={rows} initialQuery={initialQuery} />
    </Suspense>
  );
}
