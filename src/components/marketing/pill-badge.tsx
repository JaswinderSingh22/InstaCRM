import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function PillBadge({ children, className }: Props) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/90 px-3 py-1.5 text-xs font-medium text-[#4F46E5] shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
