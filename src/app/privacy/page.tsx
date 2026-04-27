import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocShell } from "@/components/legal/legal-doc-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How InstaCRM collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalDocShell
      title="Privacy Policy"
      subtitle="Last updated: April 27, 2026"
      activeHref="/privacy"
    >
      <p>
        InstaCRM (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) provides a creator-focused CRM for
        leads, deals, brands, and related workflows. This Privacy Policy explains how we handle personal and
        workspace information when you use our websites, applications, and services (collectively, the
        &quot;Services&quot;).
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> such as name, email address, and profile details you choose to
          provide (e.g. bio, social handle, avatar).
        </li>
        <li>
          <strong>Workspace content:</strong> CRM records you create (e.g. leads, deals, brands, tasks,
          payments metadata) and associated notes.
        </li>
        <li>
          <strong>Billing data:</strong> processed by our payment provider (e.g. Stripe) when you subscribe;
          we receive limited billing status and identifiers as needed to enable the Services.
        </li>
        <li>
          <strong>Technical data:</strong> such as device/browser type, IP address, and usage logs for
          security, reliability, and improvement.
        </li>
      </ul>

      <h2>How we use information</h2>
      <p>We use the information above to:</p>
      <ul>
        <li>Provide, maintain, and improve the Services;</li>
        <li>Authenticate users and enforce workspace access controls;</li>
        <li>Process subscriptions and communicate about billing;</li>
        <li>Respond to support requests and comply with legal obligations;</li>
        <li>Monitor abuse and protect the security of our systems.</li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We share data with subprocessors that help us run the product (for example, hosting and authentication
        providers, and payment processors). We do not sell your personal information. We may disclose
        information if required by law or to protect rights, safety, and integrity.
      </p>

      <h2>Retention</h2>
      <p>
        We retain information for as long as your account is active and as needed to provide the Services,
        comply with law, resolve disputes, and enforce agreements. You may request deletion where applicable;
        some records may be retained as required by law or legitimate business needs.
      </p>

      <h2>Your choices</h2>
      <p>
        You can access and update much of your profile data in-app. For other requests (access, correction,
        deletion, objection), contact{" "}
        <a href="mailto:privacy@instacrm.io">privacy@instacrm.io</a>. If you are in the EEA/UK, you may have
        additional rights under applicable data protection law.
      </p>

      <h2>Security</h2>
      <p>
        We use industry-standard measures designed to protect data in transit and at rest. No method of
        transmission over the Internet is 100% secure; we work continuously to reduce risk.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy from time to time. We will post the updated version on this page and adjust
        the &quot;Last updated&quot; date. Continued use of the Services after changes constitutes acceptance
        of the revised policy where permitted by law.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email{" "}
        <a href="mailto:privacy@instacrm.io">privacy@instacrm.io</a> or visit our{" "}
        <Link href="/help">Help Center</Link>.
      </p>
    </LegalDocShell>
  );
}
