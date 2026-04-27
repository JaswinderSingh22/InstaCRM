"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTask, deleteTask, updateTask } from "@/app/actions/crm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Task } from "@/types/database";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";

export function TaskForm() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  if (!open) {
    return (
      <Button id="task-manager-add" size="sm" onClick={() => setOpen(true)}>
        Add task
      </Button>
    );
  }
  return (
    <form
      className="mb-4 max-w-md space-y-2 rounded-md border border-border/60 bg-card/30 p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const due = fd.get("due");
        const rem = fd.get("remind");
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
        }
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="t">Title *</Label>
        <Input id="t" name="title" required />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor="d">Due</Label>
          <Input id="d" name="due" type="datetime-local" />
        </div>
        <div>
          <Label htmlFor="r">Remind at</Label>
          <Input id="r" name="remind" type="datetime-local" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
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
