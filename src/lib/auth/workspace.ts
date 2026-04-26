import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export type SessionProfile = {
  default_workspace_id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export async function getSessionAndWorkspace(): Promise<{
  user: User;
  workspaceId: string | null;
  profile: SessionProfile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("default_workspace_id, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const profile = profileRow as SessionProfile | null;
  if (profileError || !profile?.default_workspace_id) {
    return { user, workspaceId: null, profile: null };
  }

  return {
    user,
    workspaceId: profile.default_workspace_id,
    profile,
  };
}

export async function requireWorkspace() {
  const ctx = await getSessionAndWorkspace();
  if (!ctx.workspaceId) {
    throw new Error("No workspace. Complete onboarding in Supabase or contact support.");
  }
  return { ...ctx, workspaceId: ctx.workspaceId as string };
}
