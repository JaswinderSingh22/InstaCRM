import Link from "next/link";
import { Plus } from "lucide-react";

// const links = [
//   { href: "#", label: "Privacy" },
//   { href: "#", label: "Terms" },
//   { href: "#", label: "API" },
// ] as const;

export function DashboardFooterBar() {
  return (
    <div className="relative mt-10 border-t border-neutral-200/80 bg-white/50 py-4">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-1 sm:flex-row">
        <p className="text-sm font-semibold text-neutral-800">
          InstaCRM{" "}
          <span className="font-normal text-neutral-500">
            © {new Date().getFullYear()} InstaCRM. Built for Creators.
          </span>
        </p>
        {/* <nav className="flex items-center gap-6 text-xs text-neutral-500">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="hover:text-[#4F46E5]">
              {l.label}
            </Link>
          ))}
        </nav> */}
      </div>
      <Link
        href="/leads"
        className="fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#4F46E5] to-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition hover:scale-105"
        aria-label="Add lead"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  );
}
