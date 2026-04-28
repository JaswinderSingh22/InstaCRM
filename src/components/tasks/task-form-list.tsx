"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createTask, deleteTask, updateTask } from "@/app/actions/crm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Task } from "@/types/database";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";

export function TaskForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button id="task-manager-add" size="sm" onClick={() => setOpen(true)}>
        Add task
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-neutral-200 bg-white" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-900">Add task</DialogTitle>
            <DialogDescription>Schedule a follow-up. Shown on your calendar and task list.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const due = fd.get("due");
              const rem = fd.get("remind");
              setLoading(true);
              try {
                await createTask({
                  title: String(fd.get("title")),
                  dueAt: due ? new Date(String(due)).toISOString() : null,
                  reminderAt: rem ? new Date(String(rem)).toISOString() : null,
                  relatedType: "none",
                });
                setOpen(false);
                toast.success("Task added");
                router.refresh();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Error");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                name="title"
                required
                className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-due">Due</Label>
                <Input
                  id="task-due"
                  name="due"
                  type="datetime-local"
                  className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-remind">Remind at</Label>
                <Input
                  id="task-remind"
                  name="remind"
                  type="datetime-local"
                  className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="font-semibold">
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li
          key={t.id}
          className="flex items-center gap-3 rounded-md border border-border/50 bg-card/30 px-3 py-2"
        >
          <Checkbox
            checked={t.completed}
            onCheckedChange={async (c) => {
              try {
                await updateTask(t.id, { completed: Boolean(c) });
                router.refresh();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Error");
              }
            }}
          />
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-medium ${t.completed ? "text-muted-foreground line-through" : ""}`}
            >
              {t.title}
            </p>
            {t.due_at && (
              <p className="text-xs text-muted-foreground">
                Due {formatDistanceToNow(new Date(t.due_at), { addSuffix: true })}
              </p>
            )}
            {t.reminder_at && !t.completed && (
              <p className="text-xs text-amber-500/90">
                Reminder {formatDistanceToNow(new Date(t.reminder_at), { addSuffix: true })}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-destructive"
            onClick={async () => {
              if (!confirm("Delete?")) return;
              try {
                await deleteTask(t.id);
                router.refresh();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Error");
              }
            }}
          >
            Remove
          </Button>
        </li>
      ))}
    </ul>
  );
}
