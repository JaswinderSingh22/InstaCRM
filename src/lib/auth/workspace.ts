import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export type SessionProfile = {
  default_workspace_id: string;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_completed_at: string | null;
  onboarding_answers: Record<string, unknown>;
};

export type SessionContext = {
  user: User;
  workspaceId: string;
  profile: SessionProfile;
};

export function rowToSessionProfile(row: Record<string, unknown> | null | undefined): SessionProfile | null {
  const wid = row?.default_workspace_id;
  if (typeof wid !== "string" || !wid) {
    return null;
  }
  const oa = row.onboarding_answers;
  return {
    default_workspace_id: wid,
    full_name: typeof row.full_name === "string" ? row.full_name : null,
    avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
    onboarding_completed_at:
      typeof row.onboarding_completed_at === "string" ? row.onboarding_completed_at : null,
    onboarding_answers:
      oa && typeof oa === "object" && !Array.isArray(oa) ? (oa as Record<string, unknown>) : {},
  };
}

export async function getUserOrRedirect(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Use select("*") so missing onboarding columns in an older DB don’t nuke the whole query.
 * Returns null when there is no row (trigger lag) or a hard read error.
 */
export async function loadSessionProfile(userId: string): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }
  if (!row) {
    return null;
  }
  return rowToSessionProfile(row as unknown as Record<string, unknown>);
}

/**
 * App shell + server actions. If no profile, send the user to onboarding (provisioning/ensure).
 */
export async function getSessionAndWorkspace(): Promise<SessionContext> {
  const user = await getUserOrRedirect();
  const profile = await loadSessionProfile(user.id);
  if (!profile) {
    redirect("/onboarding");
  }
  return {
    user,
    workspaceId: profile.default_workspace_id,
    profile,
  };
}

export async function requireWorkspace(): Promise<SessionContext> {
  return getSessionAndWorkspace();
}
