import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { PageFade } from "@/components/layout/page-fade";
import { SettingsForms } from "@/components/settings/settings-forms";
import type { UserSettings } from "@/types/database";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, profile } = await requireWorkspace();
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const fullName =
    profile?.full_name?.trim() ||
    (user.user_metadata as { full_name?: string })?.full_name ||
    "";
  return (
    <PageFade>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Profile and workspace preferences</p>
      </div>
      <SettingsForms
        userId={user.id}
        email={user.email ?? ""}
        fullName={fullName}
        settings={settings as UserSettings | null}
      />
    </PageFade>
  );
}
