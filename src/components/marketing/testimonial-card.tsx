import { StarRating } from "@/components/marketing/star-rating";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Props = {
  quote: string;
  name: string;
  role: string;
  initials: string;
};

export function TestimonialCard({ quote, name, role, initials }: Props) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
      <StarRating />
      <blockquote className="mt-4 flex-1 text-sm italic leading-relaxed text-neutral-700 sm:text-base">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <Avatar className="size-11 border border-neutral-200">
          <AvatarFallback className="bg-indigo-100 text-sm font-semibold text-[#4F46E5]">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-neutral-900">{name}</p>
          <p className="text-sm text-[#777681]">{role}</p>
        </div>
      </figcaption>
    </figure>
  );
}
