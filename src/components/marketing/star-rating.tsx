import { Star } from "lucide-react";

type Props = { count?: number; className?: string };

export function StarRating({ count = 5, className }: Props) {
  return (
    <div className={`flex gap-0.5 text-amber-400 ${className ?? ""}`} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="size-4 fill-current" />
      ))}
    </div>
  );
}
