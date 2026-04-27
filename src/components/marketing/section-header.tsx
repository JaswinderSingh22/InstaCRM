import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  className?: string;
  align?: "center" | "left";
};

export function SectionHeader({ title, description, className, align = "center" }: Props) {
  return (
    <div
      className={cn(
        "mx-auto max-w-2xl",
        align === "center" && "text-center",
        className,
      )}
    >
      <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-balance text-base text-[#777681] sm:mt-4 sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
