import { Suspense } from "react";
import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { TaskManagerView } from "@/components/calendar/task-manager-view";
import type { Task } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "Task Manager" };

type Props = { searchParams: Promise<{ q?: string }> };

function TaskManagerLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-4 p-1">
      <div className="h-8 w-48 rounded bg-neutral-200" />
      <div className="h-24 rounded-2xl bg-neutral-100" />
      <div className="h-64 rounded-2xl bg-neutral-100" />
    </div>
  );
}

export default async function CalendarPage({ searchParams }: Props) {
  const p = await searchParams;
  const initialQuery = typeof p.q === "string" ? p.q : "";
  const { workspaceId } = await requireWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) {
    return <p className="text-destructive">Could not load tasks</p>;
  }
  const tasks = (data ?? []) as Task[];

  return (
    <Suspense fallback={<TaskManagerLoading />}>
      <TaskManagerView tasks={tasks} initialQuery={initialQuery} />
    </Suspense>
  );
}
