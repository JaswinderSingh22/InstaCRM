import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "Resources" },
] as const;

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 text-base font-bold tracking-tight text-neutral-900 sm:text-lg">
          InstaCRM
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-600 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-colors hover:text-[#4F46E5]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-neutral-700 hover:text-[#4F46E5] sm:inline"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ size: "sm" }),
              "rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#6366f1] px-3 text-white shadow-md shadow-indigo-500/20 hover:from-[#4338ca] hover:to-[#4F46E5] sm:px-4",
            )}
          >
            Start Free
          </Link>
        </div>
      </div>
      <nav
        className="flex gap-4 overflow-x-auto border-t border-neutral-100/90 px-4 py-2.5 md:hidden"
        aria-label="Page sections"
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="shrink-0 text-xs font-medium text-neutral-600 hover:text-[#4F46E5]"
          >
            {l.label}
          </Link>
        ))}
        <Link href="/login" className="shrink-0 text-xs font-semibold text-[#4F46E5]">
          Login
        </Link>
      </nav>
    </header>
  );
}
