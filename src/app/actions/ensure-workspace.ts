"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * If the new-user trigger did not create a row, the RPC recreates the same
 * workspace + profile as handle_new_user(). Safe when profile already exists.
 * Do not call revalidatePath here: this may run from the onboarding RSC during render.
 * Use router.refresh() from the client when retrying.
 */
export async function ensureUserWorkspace(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not signed in" };
  }

  const { data: row } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (row) {
    return { ok: true };
  }

  const { error } = await supabase.rpc("ensure_user_workspace");
  if (error) {
    const missingFn =
      /ensure_user_workspace|function .* not found|schema cache/i.test(error.message) ||
      (error as { code?: string }).code === "PGRST202";
    return {
      ok: false,
      error: missingFn
        ? "Apply database migration: run `20260427140000_ensure_user_workspace.sql` in the Supabase SQL editor, then try again."
        : error.message,
    };
  }
  return { ok: true };
}
