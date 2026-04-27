import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import { ListFilter } from "lucide-react";
import type { DashboardReminder } from "@/lib/data/aggregate";
import { cn } from "@/lib/utils";

const barColors = ["bg-rose-500", "bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-emerald-500"];

function whenLabel(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return `Today at ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `Tomorrow at ${format(d, "h:mm a")}`;
  return `Scheduled for ${format(d, "MMMM d, yyyy")}`;
}

type Props = {
  reminders: DashboardReminder[];
  /** When set, the whole card links here (e.g. dashboard → /calendar). */
  clickThroughHref?: string;
};

export function RemindersSection({ reminders, clickThroughHref }: Props) {
  const shell =
    "rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm" +
    (clickThroughHref
      ? " transition hover:border-[#4F46E5]/35 hover:shadow-md hover:ring-1 hover:ring-[#4F46E5]/15"
      : "");

  const body = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">Reminders</h3>
        {clickThroughHref ? (
          <span className="text-xs font-semibold text-[#4F46E5]">Open calendar →</span>
        ) : (
          <ListFilter className="size-4 text-neutral-400" aria-hidden />
        )}
      </div>
      {reminders.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No due dates on open tasks.{" "}
          {clickThroughHref ? (
            <span className="font-medium text-[#4F46E5]">Add tasks on your calendar.</span>
          ) : (
            <Link href="/calendar" className="font-medium text-[#4F46E5] hover:underline">
              Add a task
            </Link>
          )}
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {reminders.map((r, i) => (
              <li
                key={r.id}
                className="flex gap-3 rounded-xl border border-neutral-100 bg-[#F9FAFB] px-3 py-2.5"
              >
                <div className={cn("w-1 shrink-0 rounded-full", barColors[i % barColors.length])} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{r.title}</p>
                  <p className="text-xs text-neutral-500">Deadline: {whenLabel(r.dueAt)}</p>
                </div>
              </li>
            ))}
          </ul>
          {clickThroughHref ? (
            <p className="mt-2 text-center text-xs font-semibold text-[#4F46E5]">View all on calendar →</p>
          ) : (
            <Link
              href="/calendar"
              className="mt-2 block text-center text-xs font-medium text-[#4F46E5] hover:underline"
            >
              View all tasks
            </Link>
          )}
        </>
      )}
    </>
  );

  if (clickThroughHref) {
    return (
      <Link href={clickThroughHref} className={cn("block", shell)}>
        {body}
      </Link>
    );
  }

  return <div className={shell}>{body}</div>;
}
