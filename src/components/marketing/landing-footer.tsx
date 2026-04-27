import Link from "next/link";
import { HelpCircle, Mail } from "lucide-react";

const footerLinks = [
  // { href: "/help", label: "Help" },
  // { href: "/privacy", label: "Privacy" },
  // { href: "/terms", label: "Terms" },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-neutral-200/80 bg-[#f8f9fc]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-lg font-bold text-neutral-900">InstaCRM</p>
          <p className="mt-1 text-sm text-[#777681]">
            © {new Date().getFullYear()} InstaCRM. Built for Creators.
          </p>
        </div>
        {/* <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          {footerLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm text-[#777681] transition hover:text-[#4F46E5]"
            >
              {l.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 border-l border-neutral-200 pl-6">
            <Link
              href="/help"
              className="flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition hover:text-[#4F46E5]"
              aria-label="Help"
            >
              <HelpCircle className="size-4" />
            </Link>
            <a
              href="mailto:hello@instacrm.app"
              className="flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition hover:text-[#4F46E5]"
              aria-label="Email"
            >
              <Mail className="size-4" />
            </a>
          </div>
        </div> */}
      </div>
    </footer>
  );
}
