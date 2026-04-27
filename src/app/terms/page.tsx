import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocShell } from "@/components/legal/legal-doc-shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing your use of InstaCRM.",
};

export default function TermsPage() {
  return (
    <LegalDocShell
      title="Terms of Service"
      subtitle="Last updated: April 27, 2026"
      activeHref="/terms"
    >
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of InstaCRM&apos;s websites,
        applications, and related services (&quot;Services&quot;). By creating an account or using the
        Services, you agree to these Terms.
      </p>

      <h2>Eligibility &amp; accounts</h2>
      <p>
        You must be able to form a binding contract in your jurisdiction. You are responsible for maintaining
        the confidentiality of your credentials and for activity under your account. Notify us promptly of
        unauthorized use.
      </p>

      <h2>The Services</h2>
      <p>
        InstaCRM provides tools to manage creator and brand workflows (e.g. leads, deals, brands, tasks, and
        billing integrations). We may modify, suspend, or discontinue features with reasonable notice where
        practicable. We do not guarantee uninterrupted or error-free operation.
      </p>

      <h2>Your content</h2>
      <p>
        You retain rights to content you submit. You grant us a limited license to host, process, and display
        your content solely to provide and improve the Services. You represent that you have the rights needed
        to submit your content and that it does not violate law or third-party rights.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Services for unlawful, harmful, or fraudulent activity;</li>
        <li>Attempt to gain unauthorized access to our systems or other users&apos; data;</li>
        <li>Reverse engineer or scrape the Services except as allowed by law;</li>
        <li>Overload or interfere with the integrity of the Services;</li>
        <li>Use the Services to send spam or violate anti-spam laws.</li>
      </ul>

      <h2>Fees &amp; billing</h2>
      <p>
        Paid plans are billed according to the pricing shown at purchase. Taxes may apply. Failure to pay may
        result in suspension. Subscription changes and refunds are handled per the checkout flow and payment
        provider policies.
      </p>

      <h2>Third-party services</h2>
      <p>
        The Services may integrate with third parties (e.g. authentication, payments). Your use of those
        services may be subject to their terms. We are not responsible for third-party services.
      </p>

      <h2>Disclaimer of warranties</h2>
      <p>
        THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTIES OF ANY
        KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
        NON-INFRINGEMENT, TO THE FULLEST EXTENT PERMITTED BY LAW.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        TO THE FULLEST EXTENT PERMITTED BY LAW, INSTACRM AND ITS SUPPLIERS WILL NOT BE LIABLE FOR ANY
        INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR
        GOODWILL. OUR AGGREGATE LIABILITY FOR CLAIMS RELATING TO THE SERVICES WILL NOT EXCEED THE AMOUNTS YOU
        PAID US FOR THE SERVICES IN THE TWELVE (12) MONTHS BEFORE THE CLAIM (OR, IF NONE, ONE HUNDRED DOLLARS).
      </p>

      <h2>Indemnity</h2>
      <p>
        You will defend and indemnify InstaCRM against claims arising from your content, your use of the
        Services in violation of these Terms, or your violation of law or third-party rights.
      </p>

      <h2>Termination</h2>
      <p>
        You may stop using the Services at any time. We may suspend or terminate access for breach of these
        Terms or where necessary for legal or security reasons. Provisions that by their nature should survive
        will survive termination.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of Delaware, USA, excluding conflict-of-law rules,
        unless otherwise required by applicable law. Courts in that jurisdiction have exclusive venue, subject
        to mandatory consumer protections where applicable.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these Terms from time to time. We will post the new Terms on this page and update the
        &quot;Last updated&quot; date. If changes are material, we will provide additional notice where
        required. Continued use after the effective date constitutes acceptance of the updated Terms.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about these Terms, email{" "}
        <a href="mailto:legal@instacrm.io">legal@instacrm.io</a>. See also our{" "}
        <Link href="/privacy">Privacy Policy</Link> and <Link href="/help">Help Center</Link>.
      </p>
    </LegalDocShell>
  );
}
