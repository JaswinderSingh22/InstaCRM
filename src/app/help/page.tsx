import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocShell } from "@/components/legal/legal-doc-shell";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Get started with InstaCRM, billing, and creator workflows.",
};

export default function HelpPage() {
  return (
    <LegalDocShell
      title="Help Center"
      subtitle="Quick answers for InstaCRM — your CRM for creators and brand partnerships."
      activeHref="/help"
    >
      <h2>Getting started</h2>
      <p>
        After you sign up, complete onboarding to provision your workspace. Use <strong>Creators</strong> (leads)
        to track inbound brand conversations, <strong>Deals</strong> for pipeline stages, and{" "}
        <strong>Brands</strong> for partnership records and activity.
      </p>

      <h2>Account &amp; profile</h2>
      <p>
        Update your name, bio, timezone, and notification preferences under{" "}
        <Link href="/settings">Settings</Link> (you must be signed in). Avatar images are stored on your
        profile for a consistent experience across the app header.
      </p>

      <h2>Billing &amp; subscriptions</h2>
      <p>
        Plans and invoices are managed on the <Link href="/billing">Billing</Link> page. Use{" "}
        <strong>Manage plan</strong> to open the Stripe customer portal for payment methods, receipts, and
        subscription changes.
      </p>

      <h2>Data &amp; privacy</h2>
      <p>
        We process workspace data to provide the service. Read our <Link href="/privacy">Privacy Policy</Link>{" "}
        for details on what we collect and your choices. Commercial terms are in our{" "}
        <Link href="/terms">Terms of Service</Link>.
      </p>

      <h2>Contact</h2>
      <p>
        For product questions or enterprise plans, email{" "}
        <a href="mailto:support@instacrm.io">support@instacrm.io</a>. For sales-led upgrades, use{" "}
        <a href="mailto:sales@instacrm.io">sales@instacrm.io</a>.
      </p>
    </LegalDocShell>
  );
}
