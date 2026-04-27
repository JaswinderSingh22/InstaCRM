import Link from "next/link";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Props = {
  planName: string;
  price: string;
  priceSuffix?: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  isFeatured?: boolean;
  checkColor?: "indigo" | "emerald";
};

export function PricingCard({
  planName,
  price,
  priceSuffix = "/mo",
  description,
  features,
  ctaText,
  ctaHref,
  isFeatured,
  checkColor = "emerald",
}: Props) {
  const checkClass =
    checkColor === "indigo" ? "text-[#4F46E5]" : "text-emerald-500";

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-2xl border bg-white p-6 sm:p-8",
        isFeatured
          ? "border-2 border-[#4F46E5] shadow-xl shadow-indigo-500/15"
          : "border-neutral-200/80 shadow-sm",
      )}
    >
      {isFeatured ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#0EA5E9] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          Most popular
        </span>
      ) : null}
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-wider",
          isFeatured ? "text-[#4F46E5]" : "text-neutral-500",
        )}
      >
        {planName}
      </p>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-neutral-900">{price}</span>
        <span className="text-neutral-500">{priceSuffix}</span>
      </p>
      <p className="mt-2 text-sm text-[#777681]">{description}</p>
      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-neutral-800">
            <Check className={cn("mt-0.5 size-4 shrink-0", checkClass)} strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className={cn(
          "mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition",
          isFeatured
            ? "bg-gradient-to-r from-[#4F46E5] to-[#6366f1] text-white shadow-lg shadow-indigo-500/25 hover:from-[#4338ca]"
            : "border border-neutral-200 bg-neutral-50 text-neutral-900 hover:bg-neutral-100",
        )}
      >
        {ctaText}
      </Link>
    </div>
  );
}
