import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { PageFade } from "@/components/layout/page-fade";
import { AccountSettingsView } from "@/components/settings/account-settings-view";
import type { UserSettings } from "@/types/database";

export const metadata = { title: "Account Settings" };

export default async function SettingsPage() {
  const { user, workspaceId, profile } = await requireWorkspace();
  const supabase = await createClient();

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profileRow) {
    return <p className="text-sm text-destructive">Could not load profile</p>;
  }

  const row = profileRow as Record<string, unknown>;

  const { data: settingsRaw } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: ws } = await supabase
    .from("workspaces")
    .select("plan, subscription_status")
    .eq("id", workspaceId)
    .single();

  const fullName =
    (typeof row.full_name === "string" && row.full_name.trim()) ||
    profile?.full_name?.trim() ||
    (user.user_metadata as { full_name?: string })?.full_name ||
    "";

  const settings = settingsRaw as UserSettings | null;

  return (
    <PageFade>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-neutral-900">Account Settings</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          Manage your creator profile, account preferences, and notification triggers.
        </p>
      </div>
      <AccountSettingsView
        userId={user.id}
        authEmail={user.email ?? ""}
        profile={{
          fullName,
          avatarUrl:
            (typeof row.avatar_url === "string" ? row.avatar_url : null) ?? profile?.avatar_url ?? null,
          instagramHandle: typeof row.instagram_handle === "string" ? row.instagram_handle : null,
          workEmail: typeof row.work_email === "string" ? row.work_email : null,
          bio: typeof row.bio === "string" ? row.bio : null,
        }}
        settings={settings}
        workspacePlan={ws?.plan ?? null}
        subscriptionStatus={typeof ws?.subscription_status === "string" ? ws.subscription_status : "none"}
      />
    </PageFade>
  );
}
