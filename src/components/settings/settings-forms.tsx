"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateProfile, updateUserSettings } from "@/app/actions/crm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { UserSettings } from "@/types/database";

type Props = {
  userId: string;
  fullName: string;
  email: string;
  settings: UserSettings | null;
};

export function SettingsForms({ userId, fullName, email, settings }: Props) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [digest, setDigest] = useState(settings?.email_digest ?? true);
  const [tz, setTz] = useState(settings?.time_zone ?? "");
  return (
    <div className="max-w-md space-y-6">
      <div className="space-y-2">
        <h2 className="text-sm font-medium">Profile</h2>
        <p className="text-xs text-muted-foreground">Signed in as {email}</p>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await updateProfile({ fullName: name });
              toast.success("Profile updated");
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Error");
            }
          }}
        >
          <div>
            <Label htmlFor="n">Name</Label>
            <Input id="n" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" size="sm">
            Save
          </Button>
        </form>
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Preferences</h2>
        <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
          <div>
            <p className="text-sm">Weekly email digest</p>
            <p className="text-xs text-muted-foreground">Product tips & reminders</p>
          </div>
          <Switch
            checked={digest}
            onCheckedChange={async (v) => {
              setDigest(v);
              try {
                await updateUserSettings(userId, { email_digest: v });
                toast.success("Saved");
                router.refresh();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Error");
              }
            }}
          />
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await updateUserSettings(userId, { time_zone: tz || null });
              toast.success("Timezone saved");
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Error");
            }
          }}
          className="space-y-2"
        >
          <Label>Time zone (IANA)</Label>
          <Input
            placeholder="America/Los_Angeles"
            value={tz}
            onChange={(e) => setTz(e.target.value)}
          />
          <Button type="submit" size="sm" variant="secondary">
            Save timezone
          </Button>
        </form>
      </div>
    </div>
  );
}
