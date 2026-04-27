"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  Circle,
  Sparkles,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import { completeOnboarding, saveOnboardingProgress } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS, type FollowerTier, type OnboardingAnswers } from "@/lib/types/onboarding";

const TIERS: {
  id: FollowerTier;
  range: string;
  title: string;
  icon: "user" | "users" | "star" | "star2";
}[] = [
  { id: "nano", range: "1k — 10k", title: "Nano Creator", icon: "user" },
  { id: "micro", range: "10k — 50k", title: "Micro Creator", icon: "users" },
  { id: "mid", range: "50k — 250k", title: "Mid-Tier Creator", icon: "star" },
  { id: "macro", range: "250k+", title: "Macro / Celeb", icon: "star2" },
];

const MONETIZATION_OPTIONS = [
  "Sponsored & brand deals",
  "Ad revenue (AdSense, etc.)",
  "Subscriptions & memberships",
  "Digital products & courses",
  "Still exploring",
];

function formatFollowerInput(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return "";
  return new Intl.NumberFormat("en-US").format(n);
}

function parseFollowerInput(s: string): number | undefined {
  const d = s.replace(/[^\d]/g, "");
  if (!d) return undefined;
  const n = parseInt(d, 10);
  return Number.isFinite(n) ? n : undefined;
}

function TierIcon({ kind, className }: { kind: (typeof TIERS)[number]["icon"]; className?: string }) {
  if (kind === "user") return <UserPlus className={className} />;
  if (kind === "users") return <Users className={className} />;
  return <Star className={className} />;
}

// const footerLinks = [
//   { href: "#", label: "Privacy" },
//   { href: "#", label: "Terms" },
//   { href: "#", label: "API" },
//   { href: "#", label: "Careers" },
// ] as const;

type Props = {
  initial: Partial<OnboardingAnswers>;
  profileName: string | null;
};

export function OnboardingWizard({ initial, profileName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [a, setA] = useState<OnboardingAnswers>({
    fullName: initial.fullName ?? profileName ?? "",
    instagramHandle: initial.instagramHandle ?? "",
    followerTier: initial.followerTier ?? "micro",
    followerCount: initial.followerCount,
    niche: initial.niche ?? "",
    monetization: initial.monetization ?? "",
    growthGoals: initial.growthGoals ?? "",
  });

  const progress = useMemo(() => ((step + 1) / ONBOARDING_STEPS.length) * 100, [step]);

  const setField = <K extends keyof OnboardingAnswers>(k: K, v: OnboardingAnswers[K]) => {
    setA((prev) => ({ ...prev, [k]: v }));
  };

  const persist = useCallback(
    async (next: OnboardingAnswers) => {
      const r = await saveOnboardingProgress(next);
      if (r.error) {
        toast.error(r.error);
        return false;
      }
      return true;
    },
    [],
  );

  const goBack = () => {
    if (step <= 0) return;
    setStep((s) => s - 1);
  };

  const goNext = async () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      setSaving(true);
      const ok = await persist(a);
      setSaving(false);
      if (ok) setStep((s) => s + 1);
      return;
    }
    setSaving(true);
    const r = await completeOnboarding(a);
    setSaving(false);
    if (r.error) {
      toast.error(r.error);
      return;
    }
    toast.success("Welcome to InstaCRM");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200/80 bg-white/90 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:px-10">
        <Link href="/" className="text-lg font-bold tracking-tight text-neutral-900">
          InstaCRM
        </Link>
        <div className="hidden items-center gap-3 sm:flex">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-[#777681]">
            ONBOARDING PROGRESS
          </span>
          <div className="h-1.5 w-40 max-w-[40vw] overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4F46E5] to-[#22d3ee] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 lg:flex-row lg:gap-10 lg:px-8">
        <aside className="w-full shrink-0 lg:max-w-[220px]">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-[#777681]">
            Your Journey
          </h2>
          <ol className="space-y-3">
            {ONBOARDING_STEPS.map((s, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <li
                  key={s.key}
                  className={cn(
                    "flex items-start gap-2.5 text-sm",
                    current ? "font-semibold text-[#4F46E5]" : "text-neutral-600",
                  )}
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                    {done ? (
                      <span className="flex size-5 items-center justify-center rounded-full bg-[#4F46E5] text-white">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    ) : current ? (
                      <span className="flex size-5 items-center justify-center rounded-full border-2 border-[#4F46E5]">
                        <span className="size-2.5 rounded-full bg-[#4F46E5]" />
                      </span>
                    ) : (
                      <Circle className="size-5 text-neutral-300" strokeWidth={1.5} />
                    )}
                  </span>
                  <span>{s.label}</span>
                </li>
              );
            })}
          </ol>
          <div className="mt-8 hidden overflow-hidden rounded-2xl bg-neutral-900 p-4 text-white shadow-lg lg:block">
            <div className="relative mb-3 aspect-square w-16 overflow-hidden rounded-full ring-2 ring-white/20">
              <Image
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop"
                alt=""
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
            <p className="text-sm font-medium leading-relaxed text-white/90">
              &ldquo;InstaCRM helped me scale from 10k to 50k followers in 3 months.&rdquo;
            </p>
            <p className="mt-2 text-xs text-white/60">— @AlexCreator</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-2xl rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm shadow-indigo-500/5 sm:p-8">
            <p className="mb-1 inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
              <Sparkles className="size-3" />
              STEP {step + 1} OF {ONBOARDING_STEPS.length}
            </p>

            {step === 0 && (
              <StepIdentity a={a} onChange={setField} />
            )}
            {step === 1 && (
              <StepInstagram a={a} onChange={setField} />
            )}
            {step === 2 && (
              <StepMetrics a={a} onChange={setField} />
            )}
            {step === 3 && (
              <StepNiche a={a} onChange={setField} />
            )}
            {step === 4 && (
              <StepMonetization a={a} onChange={setField} />
            )}
            {step === 5 && (
              <StepGoals a={a} onChange={setField} />
            )}

            <div className="mt-10 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0 || saving}
                className={cn(
                  "inline-flex items-center gap-1.5 text-sm font-medium text-[#777681] transition hover:text-neutral-900",
                  step === 0 && "invisible",
                )}
              >
                <ArrowLeft className="size-4" />
                Back
              </button>
              <Button
                type="button"
                onClick={goNext}
                disabled={saving}
                className="h-12 min-w-[160px] rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366f1] text-base font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-[#4338ca] hover:to-[#4F46E5]"
              >
                {saving ? (
                  "Saving…"
                ) : step === ONBOARDING_STEPS.length - 1 ? (
                  "Get started"
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-auto border-t border-neutral-200/80 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-8">
          <p className="text-sm font-bold text-neutral-900">InstaCRM</p>
          {/* <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#777681]">
            {footerLinks.map((l) => (
              <Link key={l.label} href={l.href} className="hover:text-[#4F46E5]">
                {l.label}
              </Link>
            ))}
          </nav> */}
          <p className="text-xs text-[#777681]">
            © {new Date().getFullYear()} InstaCRM. Built for Creators.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StepIdentity({
  a,
  onChange,
}: {
  a: OnboardingAnswers;
  onChange: <K extends keyof OnboardingAnswers>(k: K, v: OnboardingAnswers[K]) => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Personal identity</h1>
      <p className="mt-2 text-sm text-[#777681]">
        How should we address you? This name appears in emails and the workspace.
      </p>
      <div className="mt-8 space-y-2">
        <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider text-[#777681]">
          Full name
        </Label>
        <Input
          id="fullName"
          value={a.fullName ?? ""}
          onChange={(e) => onChange("fullName", e.target.value)}
          placeholder="Creator name"
          className="h-12 rounded-xl border-neutral-200 bg-[#F8F9FC] text-base focus:bg-white"
        />
      </div>
    </div>
  );
}

function StepInstagram({
  a,
  onChange,
}: {
  a: OnboardingAnswers;
  onChange: <K extends keyof OnboardingAnswers>(k: K, v: OnboardingAnswers[K]) => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Instagram profile</h1>
      <p className="mt-2 text-sm text-[#777681]">
        We’ll use this to connect insights and match you with the right deal ranges.
      </p>
      <div className="mt-8 space-y-2">
        <Label htmlFor="ig" className="text-xs font-semibold uppercase tracking-wider text-[#777681]">
          Instagram handle
        </Label>
        <div className="relative">
          <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[#777681]">@</span>
          <Input
            id="ig"
            value={a.instagramHandle?.replace(/^@/, "") ?? ""}
            onChange={(e) => onChange("instagramHandle", e.target.value)}
            placeholder="username"
            className="h-12 rounded-xl border-neutral-200 bg-[#F8F9FC] pl-8 text-base focus:bg-white"
          />
        </div>
      </div>
    </div>
  );
}

function StepMetrics({
  a,
  onChange,
}: {
  a: OnboardingAnswers;
  onChange: <K extends keyof OnboardingAnswers>(k: K, v: OnboardingAnswers[K]) => void;
}) {
  const countStr = formatFollowerInput(a.followerCount);
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Creator metrics</h1>
      <p className="mt-2 text-sm text-[#777681]">
        We use your follower count to tailor outreach strategies and brand deal valuations.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TIERS.map((t) => {
          const selected = a.followerTier === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange("followerTier", t.id)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition",
                selected
                  ? "border-[#4F46E5] bg-violet-50/50 shadow-sm shadow-indigo-500/10"
                  : "border-neutral-200 bg-white hover:border-neutral-300",
              )}
            >
              <span className="flex w-full items-start justify-between gap-2">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl",
                    selected ? "bg-[#4F46E5]/10 text-[#4F46E5]" : "bg-neutral-100 text-neutral-600",
                  )}
                >
                  <TierIcon kind={t.icon} className="size-5" />
                </span>
                {selected && (
                  <span className="flex size-5 items-center justify-center rounded-full border-2 border-[#4F46E5]">
                    <span className="size-2.5 rounded-full bg-[#4F46E5]" />
                  </span>
                )}
              </span>
              <span className="text-xs font-medium text-[#777681]">{t.range}</span>
              <span className="font-semibold text-neutral-900">{t.title}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-6 space-y-2">
        <Label
          htmlFor="exact"
          className="text-xs font-semibold uppercase tracking-wider text-[#777681]"
        >
          Exact follower count (optional)
        </Label>
        <div className="relative">
          <Input
            id="exact"
            inputMode="numeric"
            value={countStr}
            onChange={(e) => onChange("followerCount", parseFollowerInput(e.target.value))}
            placeholder="e.g. 42,500"
            className="h-12 rounded-xl border-neutral-200 bg-[#F8F9FC] pr-10 text-base focus:bg-white"
          />
          <BarChart3 className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 size-4 text-[#777681]" />
        </div>
      </div>
    </div>
  );
}

function StepNiche({
  a,
  onChange,
}: {
  a: OnboardingAnswers;
  onChange: <K extends keyof OnboardingAnswers>(k: K, v: OnboardingAnswers[K]) => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Niche &amp; content</h1>
      <p className="mt-2 text-sm text-[#777681]">
        What topics do you create around? This helps with pipeline suggestions.
      </p>
      <div className="mt-8">
        <Textarea
          value={a.niche ?? ""}
          onChange={(e) => onChange("niche", e.target.value)}
          placeholder="e.g. fitness, tech reviews, travel vlogs"
          className="min-h-[120px] rounded-xl border-neutral-200 bg-[#F8F9FC] text-base focus:bg-white"
        />
      </div>
    </div>
  );
}

function StepMonetization({
  a,
  onChange,
}: {
  a: OnboardingAnswers;
  onChange: <K extends keyof OnboardingAnswers>(k: K, v: OnboardingAnswers[K]) => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Monetization</h1>
      <p className="mt-2 text-sm text-[#777681]">What’s your main revenue focus today?</p>
      <div className="mt-6 space-y-2">
        {MONETIZATION_OPTIONS.map((opt) => {
          const selected = a.monetization === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange("monetization", opt)}
              className={cn(
                "w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition",
                selected
                  ? "border-[#4F46E5] bg-violet-50/50 text-[#4F46E5]"
                  : "border-neutral-200 text-neutral-800 hover:border-neutral-300",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepGoals({
  a,
  onChange,
}: {
  a: OnboardingAnswers;
  onChange: <K extends keyof OnboardingAnswers>(k: K, v: OnboardingAnswers[K]) => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Growth goals</h1>
      <p className="mt-2 text-sm text-[#777681]">Where do you want to be in the next 6–12 months?</p>
      <div className="mt-8">
        <Textarea
          value={a.growthGoals ?? ""}
          onChange={(e) => onChange("growthGoals", e.target.value)}
          placeholder="More brand deals, launch a product, grow audience…"
          className="min-h-[120px] rounded-xl border-neutral-200 bg-[#F8F9FC] text-base focus:bg-white"
        />
      </div>
    </div>
  );
}
