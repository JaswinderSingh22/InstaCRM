import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "h1" | "h2" | "p";
};

export function GradientText({ children, className, as: Tag = "span" }: Props) {
  return (
    <Tag
      className={cn(
        "bg-gradient-to-r from-[#4F46E5] via-[#6366f1] to-[#0EA5E9] bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
