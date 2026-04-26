"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTemplate, deleteTemplate, updateTemplate } from "@/app/actions/crm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Template } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export function TemplateList({ items }: { items: Template[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  return (
    <div className="space-y-4">
      <Button
        size="sm"
        onClick={() => setCreating(true)}
        className={creating ? "hidden" : ""}
      >
        New template
      </Button>
      {creating && (
        <form
          className="max-w-lg space-y-2 rounded-md border border-border/60 p-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            try {
              await createTemplate({
                name: String(fd.get("name")),
                type: (fd.get("type") as Template["type"]) || "email",
                body: String(fd.get("body") || ""),
              });
              setCreating(false);
              router.refresh();
              toast.success("Created");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Error");
            }
          }}
        >
          <div>
            <Label>Name</Label>
            <Input name="name" required />
          </div>
          <div>
            <Label>Type</Label>
            <select
              name="type"
              className="h-9 w-full rounded border border-border bg-background px-2"
              defaultValue="email"
            >
              <option value="email">email</option>
              <option value="task">task</option>
              <option value="note">note</option>
            </select>
          </div>
          <div>
            <Label>Body</Label>
            <Textarea name="body" rows={5} className="font-mono text-xs" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((t) => (
          <Card key={t.id} className="border-border/60">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{t.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-destructive"
                  onClick={async () => {
                    if (!confirm("Delete?")) return;
                    try {
                      await deleteTemplate(t.id);
                      router.refresh();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Error");
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">type: {t.type}</p>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-24 text-xs"
                defaultValue={t.body}
                onBlur={async (e) => {
                  if (e.target.value === t.body) return;
                  try {
                    await updateTemplate(t.id, { body: e.target.value });
                    toast.success("Saved");
                    router.refresh();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Error");
                  }
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
