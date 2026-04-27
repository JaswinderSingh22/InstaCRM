import { LandingPageView } from "@/components/marketing/landing-page-view";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "InstaCRM — Close more brand deals",
  description:
    "The CRM for creators and agencies. Leads, deals, invoicing, and analytics in one place.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/onboarding");
  }

  return <LandingPageView />;
}
