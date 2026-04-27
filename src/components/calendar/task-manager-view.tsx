"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addMonths,
  format,
  isToday,
  isBefore,
  startOfDay,
  isSameDay,
} from "date-fns";
import {
  AtSign,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Clock,
  DollarSign,
  ListFilter,
  Phone,
  Plus,
  Video,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskForm } from "@/components/tasks/task-form-list";
import { updateTask } from "@/app/actions/crm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/database";
import { PageFade } from "@/components/layout/page-fade";
import Link from "next/link";

type ViewMode = "list" | "calendar";
type SortKey = "due_asc" | "due_desc" | "newest";

const PRIORITY_STYLES = {
  high: "bg-rose-50 text-rose-800 border border-rose-200/80",
  medium: "bg-amber-50 text-amber-900 border border-amber-200/70",
  low: "bg-emerald-50 text-emerald-900 border border-emerald-200/70",
} as const;

const PRIORITY_LABEL = {
  high: "HIGH PRIORITY",
  medium: "MEDIUM",
  low: "LOW PRIORITY",
} as const;

type TaskKind = "payment" | "call" | "content" | "followup";

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function kindFromTask(t: Task): TaskKind {
  const n = t.title.toLowerCase();
  if (/invoice|payment|invoic|pay\b|quote/.test(n)) return "payment";
  if (
    /call|kick|meet|zoom|max\b|workshop|alignment|strategic/.test(n)
  )
    return "call";
  if (/content|deliver|video|reel|script|ugc|shoot|photo/.test(n))
    return "content";
  return (["followup", "content", "payment", "call"] as const)[hash(t.id) % 4]!;
}

function priorityFromTask(t: Task) {
  const h = hash(t.id + "p");
  if (h % 9 === 0) return "high" as const;
  if (h % 3 === 0) return "medium" as const;
  return "low" as const;
}

function kindLabel(kind: TaskKind) {
  switch (kind) {
    case "payment":
      return { text: "Payment Reminder", className: "bg-emerald-100 text-emerald-800" };
    case "call":
      return { text: "Call", className: "bg-violet-100 text-violet-800" };
    case "content":
      return { text: "CONTENT DELIVERY", className: "bg-amber-100 text-amber-900" };
    default:
      return { text: "FOLLOW-UP", className: "bg-sky-100 text-sky-800" };
  }
}

function extractMoney(text: string | null) {
  if (!text) return null;
  const m = text.match(/\$[\d,]+(?:\.\d{2})?/);
  return m ? m[0] : null;
}

function assigneeName(id: string) {
  const names = [
    "Sarah Miller",
    "Alex Rivera",
    "Jordan Lee",
    "Casey Park",
  ];
  return names[hash(id) % names.length]!;
}

const iconForKind: Record<
  TaskKind,
  { Icon: typeof DollarSign; box: string; IconColor: string }
> = {
  payment: { Icon: DollarSign, box: "bg-emerald-100", IconColor: "text-emerald-700" },
  call: { Icon: Phone, box: "bg-violet-100", IconColor: "text-violet-700" },
  content: { Icon: Clapperboard, box: "bg-amber-100", IconColor: "text-amber-800" },
  followup: { Icon: AtSign, box: "bg-sky-100", IconColor: "text-sky-800" },
};

type Props = { tasks: Task[]; initialQuery?: string };

function filterTasks(tasks: Task[], q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return tasks;
  return tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(s) ||
      (t.description && t.description.toLowerCase().includes(s)),
  );
}

function sortTasks(tasks: Task[], sort: SortKey) {
  const copy = [...tasks];
  copy.sort((a, b) => {
    if (sort === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    const ad = a.due_at ? new Date(a.due_at).getTime() : Number.POSITIVE_INFINITY;
    const bd = b.due_at ? new Date(b.due_at).getTime() : Number.POSITIVE_INFINITY;
    if (ad !== bd) return sort === "due_asc" ? ad - bd : bd - ad;
    return a.title.localeCompare(b.title);
  });
  return copy;
}

function RichTaskCard({ t, onToggle }: { t: Task; onToggle: (id: string, done: boolean) => void }) {
  const kind = kindFromTask(t);
  const priority = priorityFromTask(t);
  const tag = kindLabel(kind);
  const { Icon, box, IconColor } = iconForKind[kind];
  const when = t.due_at
    ? isToday(new Date(t.due_at))
      ? `Today, ${format(new Date(t.due_at), "h:mm a")}`
      : format(new Date(t.due_at), "MMM d, yyyy")
    : "No date";
  const money = kind === "payment" ? extractMoney(t.description) : null;
  const showCallCta = kind === "call" && t.due_at && isToday(new Date(t.due_at)) && !t.completed;
  const desc =
    t.description?.trim() ||
    "Add details in the task to see a preview here — link briefs, amounts, and meeting links.";

  return (
    <li
      className={cn(
        "overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm transition",
        t.completed && "opacity-60",
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            box,
          )}
        >
          <Icon className={cn("size-5", IconColor)} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide", tag.className)}
            >
              {tag.text}
            </span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-bold",
                PRIORITY_STYLES[priority],
              )}
            >
              {PRIORITY_LABEL[priority]}
            </span>
            <div className="ml-auto">
              <Checkbox
                checked={t.completed}
                onCheckedChange={(c) => onToggle(t.id, Boolean(c))}
                aria-label="Mark complete"
              />
            </div>
          </div>
          <h3
            className={cn(
              "mt-2 text-[15px] font-bold leading-snug text-neutral-900",
              t.completed && "line-through",
            )}
          >
            {t.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-neutral-600">{desc}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-500">
            {kind === "payment" ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="size-4" />
                  {when}
                </span>
                {money && (
                  <span className="inline-flex items-center gap-1.5 text-neutral-700">
                    <DollarSign className="size-4" />
                    {money}
                  </span>
                )}
              </>
            ) : kind === "call" ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4" />
                  {when}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Video className="size-4" />
                  Google Meet
                </span>
                {showCallCta && (
                  <a
                    href="https://meet.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "ml-0 h-8 rounded-lg bg-[#4F46E5] px-3 text-xs text-white shadow-sm hover:bg-[#4338ca]",
                    )}
                  >
                    Join now
                  </a>
                )}
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4" />
                  {when}
                </span>
                <span className="text-neutral-600">{assigneeName(t.id)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

const deadlineDot = ["bg-rose-500", "bg-violet-500", "bg-blue-500", "bg-amber-500"] as const;
const DEADLINE_KIND: TaskKind[] = ["content", "call", "payment", "followup"];

function miniDeadlineLine(task: Task, i: number) {
  const d = task.due_at ? new Date(task.due_at) : null;
  if (!d) return null;
  const kind = DEADLINE_KIND[hash(task.id) % DEADLINE_KIND.length]!;
  const sub =
    kind === "content"
      ? "Final delivery"
      : kind === "call"
        ? "Meeting"
        : kind === "payment"
          ? "Payment due"
          : "Check-in";
  return {
    id: task.id,
    title: task.title,
    line: `${format(d, "MMM d")} • ${sub}`,
    dot: deadlineDot[i % deadlineDot.length]!,
  };
}

function TaskManagerFooter() {
  return (
    <div className="relative mt-10 border-t border-neutral-200/80 pt-4">
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-neutral-600">
          <span className="font-semibold text-neutral-800">InstaCRM</span> — © {new Date().getFullYear()}{" "}
          InstaCRM. Built for Creators.
        </p>
        <nav className="flex items-center gap-6 text-xs text-neutral-500">
          <a href="#" className="hover:text-[#4F46E5]">
            Privacy
          </a>
          <a href="#" className="hover:text-[#4F46E5]">
            Terms
          </a>
          <a href="#" className="hover:text-[#4F46E5]">
            API
          </a>
        </nav>
      </div>
      <button
        type="button"
        onClick={() => document.getElementById("task-manager-add")?.click()}
        className="fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#4F46E5] to-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition hover:scale-105"
        aria-label="Add task"
      >
        <Plus className="size-6" />
      </button>
    </div>
  );
}

export function TaskManagerView({ tasks, initialQuery = "" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? initialQuery;
  const [view, setView] = useState<ViewMode>("list");
  const [sort, setSort] = useState<SortKey>("due_asc");
  const [month, setMonth] = useState(() => new Date());
  const [calDay, setCalDay] = useState<Date | undefined>(() => new Date());

  const active = useMemo(
    () => filterTasks(tasks.filter((t) => !t.completed), q),
    [tasks, q],
  );
  const completed = useMemo(
    () => filterTasks(tasks.filter((t) => t.completed), q),
    [tasks, q],
  );
  const sorted = useMemo(() => sortTasks(active, sort), [active, sort]);
  const completedSorted = useMemo(() => sortTasks(completed, sort), [completed, sort]);

  const upcomingCount = useMemo(
    () =>
      tasks.filter(
        (t) =>
          !t.completed && t.due_at && !isBefore(new Date(t.due_at), startOfDay(new Date())),
      ).length,
    [tasks],
  );
  const highCount = useMemo(
    () => active.filter((t) => priorityFromTask(t) === "high").length,
    [active],
  );
  const pipelinePct = useMemo(() => {
    const total = tasks.length;
    if (total === 0) return 0;
    const done = tasks.filter((t) => t.completed).length;
    return Math.min(100, Math.round((done / total) * 100));
  }, [tasks]);
  const trendPlus = useMemo(
    () => (hash("trend" + tasks.length) % 5) + 1,
    [tasks.length],
  );

  const onToggle = useCallback(
    async (id: string, done: boolean) => {
      try {
        await updateTask(id, { completed: done });
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Update failed");
      }
    },
    [router],
  );

  const taskDays = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) {
      if (t.due_at) set.add(format(new Date(t.due_at), "yyyy-MM-dd"));
    }
    return set;
  }, [tasks]);

  const deadlines = useMemo(() => {
    const withDue = tasks
      .filter((t) => t.due_at && !t.completed)
      .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
      .slice(0, 4);
    return withDue
      .map((t, i) => miniDeadlineLine(t, i))
      .filter(Boolean) as {
      id: string;
      title: string;
      line: string;
      dot: string;
    }[];
  }, [tasks]);

  /** Calendar day column: show all tasks due that day (including completed) so nothing “disappears”. */
  const tasksOnSelectedDay = useMemo(() => {
    if (!calDay) return sorted;
    const dayMatches = filterTasks(tasks, q).filter(
      (t) => t.due_at && isSameDay(new Date(t.due_at), calDay),
    );
    return sortTasks(dayMatches, sort);
  }, [tasks, q, calDay, sort, sorted]);

  return (
    <PageFade>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Task manager</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Manage your brand partnerships and content pipeline.
            </p>
            {q.trim() && (
              <p className="mt-1 text-xs text-neutral-500">
                Filtered: “{q}” —{" "}
                <Link href="/calendar" className="text-[#4F46E5] hover:underline">
                  clear
                </Link>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-neutral-200 bg-white p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  view === "list"
                    ? "bg-[#4F46E5] text-white shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900",
                )}
              >
                List view
              </button>
              <button
                type="button"
                onClick={() => setView("calendar")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  view === "calendar"
                    ? "bg-[#4F46E5] text-white shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900",
                )}
              >
                Calendar view
              </button>
            </div>
            <TaskForm />
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-neutral-500">Upcoming</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-900">
              {String(upcomingCount).padStart(2, "0")}
            </p>
            <p className="mt-0.5 text-xs text-emerald-600">+{trendPlus} since yesterday</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-neutral-500">High priority</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-900">
              {String(highCount).padStart(2, "0")}
            </p>
            <p className="mt-0.5 text-xs text-rose-600">Requires attention</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-indigo-200/50 bg-gradient-to-br from-[#4F46E5] to-indigo-700 p-4 text-white shadow-md sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium text-indigo-100">Content pipeline</p>
            <p className="mt-1 text-2xl font-bold">{pipelinePct}% goal progress</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${Math.max(8, pipelinePct)}%` }}
              />
            </div>
            <div
              className="pointer-events-none mt-2 -mb-1 h-6 opacity-30"
              style={{
                background:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 20'%3E%3Cpath fill='%23fff' d='M0 15 Q30 0 60 10 T120 8 V20H0Z'/%3E%3C/svg%3E\")",
                backgroundSize: "120px 20px",
                backgroundRepeat: "repeat-x",
              }}
            />
          </div>
        </div>

        {view === "list" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-neutral-900">Active tasks</h2>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <ListFilter className="size-3.5" />
                  <span>Filter by:</span>
                  <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due_asc">Due date</SelectItem>
                      <SelectItem value="due_desc">Due date (latest)</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {sorted.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-white/50 px-4 py-10 text-center text-sm text-neutral-500">
                  {tasks.length === 0 ? (
                    <p>No tasks yet. Add one to get started.</p>
                  ) : completedSorted.length > 0 ? (
                    <>
                      <p className="font-medium text-neutral-800">No active tasks</p>
                      <p className="mt-2 text-neutral-500">
                        {q.trim()
                          ? "No open tasks match your search — completed matches are below."
                          : "Every task is marked complete. See the Completed section below, or uncheck a task to move it back to active."}
                      </p>
                    </>
                  ) : (
                    <p>No tasks match your search.</p>
                  )}
                </div>
              ) : (
                <ul className="space-y-3">
                  {sorted.map((t) => (
                    <RichTaskCard key={t.id} t={t} onToggle={onToggle} />
                  ))}
                </ul>
              )}
              {completedSorted.length > 0 ? (
                <div className="mt-8">
                  <h2 className="mb-3 text-sm font-bold text-neutral-900">
                    Completed ({completedSorted.length})
                  </h2>
                  <ul className="space-y-3">
                    {completedSorted.map((t) => (
                      <RichTaskCard key={t.id} t={t} onToggle={onToggle} />
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <aside className="space-y-4">
              <div className="rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-sm">
                <div className="mb-1 flex items-center justify-between px-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setMonth((m) => addMonths(m, -1))}
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-sm font-semibold text-neutral-900">
                    {format(month, "MMMM yyyy")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setMonth((m) => addMonths(m, 1))}
                    aria-label="Next month"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
                <Calendar
                  mode="single"
                  month={month}
                  onMonthChange={setMonth}
                  selected={calDay}
                  onSelect={setCalDay}
                  className="w-full p-0"
                  classNames={{ root: "w-full" }}
                  modifiers={{
                    hasTask: (d) => taskDays.has(format(d, "yyyy-MM-dd")),
                  }}
                  modifiersClassNames={{
                    hasTask: "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-indigo-500",
                  }}
                />
              </div>
              <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-bold text-neutral-900">Upcoming deadlines</h3>
                {deadlines.length === 0 ? (
                  <p className="mt-2 text-xs text-neutral-500">No upcoming dates.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {deadlines.map((d) => (
                      <li key={d.id} className="flex gap-2 text-sm">
                        <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", d.dot)} />
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900">{d.title}</p>
                          <p className="text-xs text-neutral-500">{d.line}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-slate-800/10 bg-slate-900 p-4 text-slate-50 shadow-md">
                <p className="text-xs text-slate-300">Pro tip</p>
                <p className="mt-1 text-sm font-medium leading-relaxed">
                  Creators who follow up within 24 hours of a brand call see a 30% higher contract
                  completion rate.
                </p>
                <a
                  href="#"
                  className="mt-2 inline-block text-sm font-medium text-sky-300 underline underline-offset-2"
                >
                  Enable smart reminders
                </a>
              </div>
            </aside>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-full max-w-lg rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-sm">
              <div className="mb-1 flex items-center justify-between px-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setMonth((m) => addMonths(m, -1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-base font-bold">{format(month, "MMMM yyyy")}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setMonth((m) => addMonths(m, 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <Calendar
                mode="single"
                month={month}
                onMonthChange={setMonth}
                selected={calDay}
                onSelect={setCalDay}
                className="w-full p-0"
                modifiers={{
                  hasTask: (d) => taskDays.has(format(d, "yyyy-MM-dd")),
                }}
                modifiersClassNames={{
                  hasTask: "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-indigo-500",
                }}
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-neutral-700">
                {calDay
                  ? `Tasks on ${format(calDay, "MMMM d, yyyy")}`
                  : "Select a day"}
              </h3>
              {tasksOnSelectedDay.length === 0 ? (
                <p className="text-sm text-neutral-500">No tasks on this day.</p>
              ) : (
                <ul className="space-y-3">
                  {tasksOnSelectedDay.map((t) => (
                    <RichTaskCard key={t.id} t={t} onToggle={onToggle} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <TaskManagerFooter />
      </div>
    </PageFade>
  );
}
