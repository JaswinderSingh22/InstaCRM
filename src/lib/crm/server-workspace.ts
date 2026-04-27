import { createClient } from "@/lib/supabase/server";

export type WorkspaceCrmError = { ok: false; error: string; status: 401 | 400 | 500 };
export type WorkspaceCrmOk = {
  ok: true;
  supabase: Awaited<ReturnType<typeof createClient>>;
  workspaceId: string;
  userId: string;
};

/**
 * Resolves the logged-in user + their default workspace for CRM queries and API routes.
 * Use {@link getWorkspaceContextOrThrow} in server actions that already throw on failure.
 */
export async function getWorkspaceContext(): Promise<WorkspaceCrmError | WorkspaceCrmOk> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("default_workspace_id")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }
  const wid = profile?.default_workspace_id;
  if (!wid) {
    return { ok: false, error: "No workspace", status: 400 };
  }
  return { ok: true, supabase, workspaceId: wid, userId: user.id };
}

export async function getWorkspaceContextOrThrow() {
  const c = await getWorkspaceContext();
  if (!c.ok) {
    throw new Error(c.error);
  }
  return c;
}
