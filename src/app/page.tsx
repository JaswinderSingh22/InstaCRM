import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { HeroHeading } from "@/components/marketing/hero-heading";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const features = [
  "Leads, deals, and pipeline in one place",
  "Brands and accounts you actually enjoy opening",
  "Tasks with reminders and payments tracking",
  "Templates, analytics, and Stripe billing",
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,hsl(262_55%_45%/0.18),transparent_55%)] dark:bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,hsl(262_50%_40%/0.2),transparent_55%)]" />
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-6 sm:pt-20 lg:pt-24">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="size-3" />
          Built for teams who outgrew the spreadsheet
        </div>
        <HeroHeading>Customer relationships, designed like a product</HeroHeading>
        <p className="mt-4 max-w-2xl text-balance text-lg text-muted-foreground">
          InstaCRM brings Linear clarity, Notion structure, and HubSpot power into a single
          workspace — fast, dark-mode native, and ready to ship.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-md shadow-lg shadow-primary/20",
            )}
          >
            Get started
            <ArrowRight className="ml-1 size-4" />
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-md border-border/80 bg-card/30 backdrop-blur",
            )}
          >
            Sign in
          </Link>
        </div>
        <ul className="mt-12 grid gap-2 sm:grid-cols-2">
          {features.map((f) => (
            <li
              key={f}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="size-3" />
              </span>
              {f}
            </li>
          ))}
        </ul>
        <p className="mt-20 text-center text-xs text-muted-foreground">
          Next.js 15 · Supabase · Stripe · shadcn/ui
        </p>
      </div>
    </div>
  );
}
