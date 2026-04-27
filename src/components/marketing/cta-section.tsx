import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
};

export function CtaSection({ title, description, primaryCta, secondaryCta }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1d4ed8] via-[#4F46E5] to-[#0ea5e9] px-6 py-12 text-center shadow-xl shadow-indigo-500/20 sm:px-10 sm:py-16">
      <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-white/90 sm:text-base">{description}</p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        <Link
          href={primaryCta.href}
          className="w-full min-w-[200px] rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#4F46E5] shadow-lg transition hover:bg-neutral-100 sm:w-auto"
        >
          {primaryCta.label}
        </Link>
        <Link
          href={secondaryCta.href}
          className={cn(
            "w-full min-w-[200px] rounded-xl border-2 border-white/90 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto",
          )}
        >
          {secondaryCta.label}
        </Link>
      </div>
    </div>
  );
}
