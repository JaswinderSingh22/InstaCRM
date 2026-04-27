import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/help", label: "Help" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

type Props = {
  title: string;
  subtitle?: string;
  activeHref?: (typeof nav)[number]["href"];
  children: ReactNode;
};

export function LegalDocShell({ title, subtitle, activeHref, children }: Props) {
  return (
    <div className="min-h-dvh bg-[#F4F5FA] text-neutral-900">
      <header className="border-b border-neutral-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link href="/" className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-[#4F46E5]">InstaCRM</span>
            <span className="text-[10px] font-semibold tracking-wide text-neutral-500">Creator operations</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {/* {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  activeHref === item.href
                    ? "bg-indigo-50 text-[#4F46E5]"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                )}
              >
                {item.label}
              </Link>
            ))} */}
            <Link
              href="/login"
              className="ml-1 rounded-lg bg-gradient-to-r from-[#4F46E5] to-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:from-[#4338ca] hover:to-indigo-600"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm ring-1 ring-neutral-200/40 sm:p-10">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-neutral-900">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-neutral-500">{subtitle}</p> : null}
          <div className="mt-8 space-y-4 text-sm leading-relaxed text-neutral-600 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-neutral-900 [&_h2]:first:mt-0 [&_p]:text-neutral-600 [&_strong]:font-semibold [&_strong]:text-neutral-800 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:font-medium [&_a]:text-[#4F46E5] [&_a]:underline-offset-2 hover:[&_a]:underline">
            {children}
          </div>
        </div>
      </main>

      <footer className="border-t border-neutral-200/80 bg-white py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-neutral-500 sm:flex-row sm:px-6 sm:text-left">
          <p>© {new Date().getFullYear()} InstaCRM. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/help" className="font-medium text-[#4F46E5] hover:underline">
              Help
            </Link>
            <Link href="/privacy" className="font-medium text-[#4F46E5] hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="font-medium text-[#4F46E5] hover:underline">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
