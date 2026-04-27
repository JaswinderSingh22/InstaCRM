import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Variant = "default" | "primary" | "soft";

const variants: Record<
  Variant,
  { wrap: string; title: string; body: string; iconBg: string; icon: string }
> = {
  default: {
    wrap: "border border-neutral-200/80 bg-white shadow-sm shadow-neutral-200/40",
    title: "text-neutral-900",
    body: "text-[#777681]",
    iconBg: "bg-indigo-100 text-[#4F46E5]",
    icon: "text-[#4F46E5]",
  },
  primary: {
    wrap: "bg-gradient-to-br from-[#4F46E5] to-[#3730a3] text-white shadow-lg shadow-indigo-500/25",
    title: "text-white",
    body: "text-white/90",
    iconBg: "bg-white/20 text-white",
    icon: "text-white",
  },
  soft: {
    wrap: "border border-indigo-100/80 bg-indigo-50/60",
    title: "text-neutral-900",
    body: "text-[#777681]",
    iconBg: "bg-white text-[#4F46E5] shadow-sm",
    icon: "text-[#4F46E5]",
  },
};

type Props = {
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: Variant;
  className?: string;
  children?: React.ReactNode;
};

export function FeatureCard({
  title,
  description,
  icon: Icon,
  variant = "default",
  className,
  children,
}: Props) {
  const v = variants[variant];
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-3xl p-6 sm:p-8",
        v.wrap,
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 flex size-10 items-center justify-center rounded-xl sm:size-12",
          v.iconBg,
        )}
      >
        <Icon className={cn("size-5 sm:size-6", v.icon)} strokeWidth={1.75} />
      </div>
      <h3 className={cn("text-lg font-bold sm:text-xl", v.title)}>{title}</h3>
      <p className={cn("mt-2 flex-1 text-sm leading-relaxed sm:text-base", v.body)}>
        {description}
      </p>
      {children ? <div className="mt-4 flex-shrink-0">{children}</div> : null}
    </div>
  );
}
