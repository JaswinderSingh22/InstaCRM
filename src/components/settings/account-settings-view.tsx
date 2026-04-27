"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateProfile, updateUserSettings } from "@/app/actions/crm";
import type { UserSettings } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BIO_MAX = 500;
const AVATAR_DATA_URL_MAX = 380_000;

const TIMEZONES: { value: string; label: string }[] = [
  { value: "America/Los_Angeles", label: "Pacific Time (PT, UTC−8)" },
  { value: "America/Denver", label: "Mountain Time (MT, UTC−7)" },
  { value: "America/Chicago", label: "Central Time (CT, UTC−6)" },
  { value: "America/New_York", label: "Eastern Time (ET, UTC−5)" },
  { value: "America/Phoenix", label: "Arizona (MST, UTC−7)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HST, UTC−10)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
];

const LOCALES: { value: string; label: string }[] = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "fr-FR", label: "Français (France)" },
  { value: "de-DE", label: "Deutsch (Deutschland)" },
];

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0]! + p[1]![0]!).toUpperCase();
}

function normalizeHandle(raw: string) {
  const t = raw.trim();
  if (!t) return "";
  return t.startsWith("@") ? t : `@${t}`;
}

type Props = {
  userId: string;
  authEmail: string;
  profile: {
    fullName: string;
    avatarUrl: string | null;
    instagramHandle: string | null;
    workEmail: string | null;
    bio: string | null;
  };
  settings: UserSettings | null;
  workspacePlan: string | null;
  subscriptionStatus: string;
};

export function AccountSettingsView({
  userId,
  authEmail,
  profile,
  settings,
  workspacePlan,
  subscriptionStatus,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState("profile");

  const [fullName, setFullName] = useState(profile.fullName);
  const [instagram, setInstagram] = useState(profile.instagramHandle ?? "");
  const [workEmail, setWorkEmail] = useState(profile.workEmail ?? authEmail);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [tz, setTz] = useState(() => {
    const z = settings?.time_zone?.trim();
    if (z && TIMEZONES.some((t) => t.value === z)) return z;
    return settings?.time_zone || "America/Los_Angeles";
  });
  const [locale, setLocale] = useState(settings?.locale ?? "en-US");

  const [emailUpdates, setEmailUpdates] = useState(settings?.email_digest ?? true);
  const [campaignAlerts, setCampaignAlerts] = useState(settings?.campaign_alerts ?? true);
  const [systemNews, setSystemNews] = useState(settings?.system_news ?? false);

  const [saving, setSaving] = useState(false);
  const [dirtyProfile, setDirtyProfile] = useState(false);

  const displayEmail = workEmail.trim() || authEmail;

  const onAvatarFile = (f: File | null) => {
    if (!f || !f.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result || "");
      if (data.length > AVATAR_DATA_URL_MAX) {
        toast.error("Image is too large. Use a file under ~250KB.");
        return;
      }
      setAvatarUrl(data);
      setDirtyProfile(true);
    };
    reader.readAsDataURL(f);
  };

  const saveProfile = async () => {
    if (bio.length > BIO_MAX) {
      toast.error(`Bio must be ${BIO_MAX} characters or less`);
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        updateProfile({
          fullName: fullName.trim(),
          instagramHandle: normalizeHandle(instagram) || null,
          bio: bio.trim() || null,
          workEmail: workEmail.trim() || null,
          avatarUrl: avatarUrl ?? null,
        }),
        updateUserSettings(userId, {
          time_zone: tz || null,
          locale: locale || "en-US",
        }),
      ]);
      toast.success("Changes saved");
      setDirtyProfile(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const cancelProfile = () => {
    setFullName(profile.fullName);
    setInstagram(profile.instagramHandle ?? "");
    setWorkEmail(profile.workEmail ?? authEmail);
    setBio(profile.bio ?? "");
    setAvatarUrl(profile.avatarUrl);
    setTz(settings?.time_zone || "America/Los_Angeles");
    setLocale(settings?.locale ?? "en-US");
    setDirtyProfile(false);
  };

  const persistToggle = async (
    key: "email_digest" | "campaign_alerts" | "system_news",
    value: boolean,
  ) => {
    try {
      await updateUserSettings(userId, { [key]: value });
      toast.success("Saved");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="gap-6">
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-b border-neutral-200 bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2"
      >
        {(
          [
            ["profile", "Profile"],
            ["account", "Account"],
            ["notifications", "Notifications"],
            ["billing", "Billing"],
          ] as const
        ).map(([value, label]) => (
          <TabsTrigger
            key={value}
            value={value}
            className="shrink-0 rounded-none px-3 pb-3 text-sm font-medium text-neutral-500 data-active:text-neutral-900 data-active:after:bg-[#4F46E5] sm:px-4 sm:text-base"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="profile" className="mt-0">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Card className="border-neutral-200/80 bg-white shadow-sm ring-neutral-200/60">
              <CardHeader className="border-b border-neutral-100 pb-4">
                <CardTitle className="text-base font-semibold text-neutral-900">Basic info</CardTitle>
                <CardDescription>How you appear to brands and teammates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="relative shrink-0">
                    <Avatar className="size-24 border-2 border-neutral-100 shadow-sm">
                      <AvatarImage src={avatarUrl ?? undefined} alt="" />
                      <AvatarFallback className="bg-indigo-100 text-lg font-semibold text-[#4F46E5]">
                        {initials(fullName || displayEmail)}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#4F46E5] text-white shadow-md hover:bg-[#4338ca]"
                      aria-label="Change profile photo"
                    >
                      <Camera className="size-3.5" />
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => onAvatarFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Full name</Label>
                      <Input
                        id="full-name"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setDirtyProfile(true);
                        }}
                        className="h-11 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram handle</Label>
                      <Input
                        id="instagram"
                        value={instagram}
                        onChange={(e) => {
                          setInstagram(e.target.value);
                          setDirtyProfile(true);
                        }}
                        placeholder="@yourhandle"
                        className="h-11 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="work-email">Work email</Label>
                      <Input
                        id="work-email"
                        type="email"
                        value={workEmail}
                        onChange={(e) => {
                          setWorkEmail(e.target.value);
                          setDirtyProfile(true);
                        }}
                        className="h-11 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-200/80 bg-white shadow-sm ring-neutral-200/60">
              <CardHeader className="border-b border-neutral-100 pb-4">
                <CardTitle className="text-base font-semibold text-neutral-900">Bio & preferences</CardTitle>
                <CardDescription>Tell partners who you are and how you work.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bio">Creator bio</Label>
                    <span className="text-xs text-neutral-500">
                      {bio.length} / {BIO_MAX} characters
                    </span>
                  </div>
                  <Textarea
                    id="bio"
                    value={bio}
                    maxLength={BIO_MAX}
                    onChange={(e) => {
                      setBio(e.target.value);
                      setDirtyProfile(true);
                    }}
                    placeholder="Short intro for campaigns and outreach…"
                    className="min-h-32 rounded-lg border-neutral-200 bg-[#F8F9FC] text-sm"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tz">Timezone</Label>
                    <select
                      id="tz"
                      value={tz}
                      onChange={(e) => {
                        setTz(e.target.value);
                        setDirtyProfile(true);
                      }}
                      className="flex h-11 w-full rounded-lg border border-neutral-200 bg-[#F8F9FC] px-3 text-sm text-neutral-900 outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20"
                    >
                      {TIMEZONES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                      {settings?.time_zone &&
                      !TIMEZONES.some((t) => t.value === settings.time_zone) ? (
                        <option value={settings.time_zone}>{settings.time_zone}</option>
                      ) : null}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locale">Language</Label>
                    <select
                      id="locale"
                      value={locale}
                      onChange={(e) => {
                        setLocale(e.target.value);
                        setDirtyProfile(true);
                      }}
                      className="flex h-11 w-full rounded-lg border border-neutral-200 bg-[#F8F9FC] px-3 text-sm text-neutral-900 outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20"
                    >
                      {LOCALES.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-lg sm:w-auto"
                    onClick={cancelProfile}
                    disabled={!dirtyProfile || saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="w-full rounded-lg bg-gradient-to-r from-[#4F46E5] to-indigo-600 font-semibold text-white hover:from-[#4338ca] hover:to-indigo-600 sm:w-auto"
                    onClick={() => void saveProfile()}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-0 bg-gradient-to-br from-[#4F46E5] to-indigo-700 text-white shadow-lg shadow-indigo-500/20">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Security strength</CardTitle>
                <CardDescription className="text-violet-100">
                  Add two-factor authentication to protect payouts and contracts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-xs font-medium text-violet-100">
                    <span>Score</span>
                    <span>85%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full w-[85%] rounded-full bg-white" />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full rounded-xl border-0 bg-white font-semibold text-[#4F46E5] hover:bg-violet-50"
                  onClick={() => setTab("account")}
                >
                  Improve security
                </Button>
              </CardContent>
            </Card>

            <Card className="border-neutral-200/80 bg-white shadow-sm ring-neutral-200/60">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-neutral-900">Quick notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-800">Email updates</p>
                    <p className="text-xs text-neutral-500">Weekly digest & tips</p>
                  </div>
                  <Switch
                    checked={emailUpdates}
                    onCheckedChange={async (v) => {
                      setEmailUpdates(v);
                      await persistToggle("email_digest", v);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-800">Campaign alerts</p>
                    <p className="text-xs text-neutral-500">Deals and deadlines</p>
                  </div>
                  <Switch
                    checked={campaignAlerts}
                    onCheckedChange={async (v) => {
                      setCampaignAlerts(v);
                      await persistToggle("campaign_alerts", v);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-800">System news</p>
                    <p className="text-xs text-neutral-500">Product announcements</p>
                  </div>
                  <Switch
                    checked={systemNews}
                    onCheckedChange={async (v) => {
                      setSystemNews(v);
                      await persistToggle("system_news", v);
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-rose-200/80 bg-rose-50/50 shadow-sm ring-rose-100">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-rose-900">Danger zone</CardTitle>
                <CardDescription className="text-rose-800/80">
                  Deactivating removes your access to this workspace. This cannot be undone from the app.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-rose-200 bg-white font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() =>
                    toast.message("Contact support to deactivate your account.", {
                      description: "We’ll verify ownership before closing access.",
                    })
                  }
                >
                  Deactivate account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="account" className="mt-0">
        <Card className="max-w-xl border-neutral-200/80 bg-white shadow-sm ring-neutral-200/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-neutral-900">Sign-in & security</CardTitle>
            <CardDescription>Your InstaCRM account is tied to this email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Login email</Label>
              <Input value={authEmail} readOnly className="h-11 rounded-lg bg-neutral-100" />
              <p className="text-xs text-neutral-500">
                To change the email you use to sign in, update it in your Supabase Auth settings or contact
                support.
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-[#F8F9FC] p-4">
              <p className="text-sm font-medium text-neutral-900">Password</p>
              <p className="mt-1 text-sm text-neutral-600">
                Use the reset link on the login page if you need a new password.
              </p>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 rounded-lg")}
              >
                Go to login
              </Link>
            </div>
            <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-4">
              <p className="text-sm font-medium text-amber-950">Two-factor authentication</p>
              <p className="mt-1 text-sm text-amber-900/80">
                2FA is not configured for this project yet. When enabled, you’ll confirm sign-ins from your
                authenticator app.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications" className="mt-0">
        <Card className="max-w-xl border-neutral-200/80 bg-white shadow-sm ring-neutral-200/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-neutral-900">Notification triggers</CardTitle>
            <CardDescription>Control what InstaCRM is allowed to email you about.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 p-4">
              <div>
                <p className="text-sm font-medium text-neutral-900">Email updates</p>
                <p className="text-xs text-neutral-500">Digest, tips, and recap emails</p>
              </div>
              <Switch
                checked={emailUpdates}
                onCheckedChange={async (v) => {
                  setEmailUpdates(v);
                  await persistToggle("email_digest", v);
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 p-4">
              <div>
                <p className="text-sm font-medium text-neutral-900">Campaign alerts</p>
                <p className="text-xs text-neutral-500">Movement on deals and tasks</p>
              </div>
              <Switch
                checked={campaignAlerts}
                onCheckedChange={async (v) => {
                  setCampaignAlerts(v);
                  await persistToggle("campaign_alerts", v);
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 p-4">
              <div>
                <p className="text-sm font-medium text-neutral-900">System news</p>
                <p className="text-xs text-neutral-500">Product and maintenance notices</p>
              </div>
              <Switch
                checked={systemNews}
                onCheckedChange={async (v) => {
                  setSystemNews(v);
                  await persistToggle("system_news", v);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="billing" className="mt-0">
        <Card className="max-w-xl border-neutral-200/80 bg-white shadow-sm ring-neutral-200/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-neutral-900">Billing</CardTitle>
            <CardDescription>Workspace plan and Stripe subscription.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-neutral-100 bg-[#F8F9FC] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Current plan</p>
              <p className="mt-1 text-lg font-bold text-neutral-900">{workspacePlan ?? "Free"}</p>
              <p className="text-sm text-neutral-600">Status: {subscriptionStatus}</p>
            </div>
            <Link
              href="/billing"
              className={cn(
                buttonVariants(),
                "rounded-lg bg-gradient-to-r from-[#4F46E5] to-indigo-600 font-semibold text-white hover:from-[#4338ca] hover:to-indigo-600",
              )}
            >
              Open billing settings
            </Link>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
