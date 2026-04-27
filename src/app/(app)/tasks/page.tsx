import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { TaskForm, TaskList } from "@/components/tasks/task-form-list";
import { PageFade } from "@/components/layout/page-fade";
import type { Task } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "Tasks" };

export default async function TasksPage() {
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
    <PageFade>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks & reminders</h1>
          <p className="text-sm text-muted-foreground">What needs to happen next</p>
        </div>
        <TaskForm />
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks</p>
      ) : (
        <TaskList tasks={tasks} />
      )}
    </PageFade>
  );
}
