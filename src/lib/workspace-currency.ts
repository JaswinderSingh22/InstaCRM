import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeWorkspaceCurrency } from "@/lib/currency";

export async function fetchWorkspaceDefaultCurrency(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("default_currency")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error || !data) {
    return "INR";
  }
  const raw = (data as { default_currency?: string | null }).default_currency;
  return normalizeWorkspaceCurrency(raw ?? undefined);
}
