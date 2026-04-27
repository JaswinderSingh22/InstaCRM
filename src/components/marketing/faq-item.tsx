import { cn } from "@/lib/utils";

type Props = {
  question: string;
  answer: string;
  className?: string;
};

export function FaqItem({ question, answer, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200/60 bg-neutral-50/80 p-5 sm:p-6",
        className,
      )}
    >
      <h3 className="font-semibold text-neutral-900">{question}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#777681] sm:text-base">{answer}</p>
    </div>
  );
}
