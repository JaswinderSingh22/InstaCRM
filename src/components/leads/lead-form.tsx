"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLead } from "@/app/actions/crm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function LeadForm() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="rounded-md" size="sm">
        New lead
      </Button>
    );
  }
  return (
    <form
      className="mb-4 flex max-w-2xl flex-col gap-2 rounded-md border border-border/60 bg-card/30 p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
          await createLead({
            name: String(fd.get("name")),
            email: String(fd.get("email") || undefined),
            company: String(fd.get("company") || undefined),
            source: String(fd.get("source") || undefined),
            status: (fd.get("status") as "new" | "contacted" | "qualified" | "lost") || "new",
          });
          setOpen(false);
          toast.success("Lead created");
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed");
        }
      }}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="source">Source</Label>
          <Input id="source" name="source" placeholder="ads, organic, event…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue="new"
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <div className="flex items-end gap-2 sm:col-span-2">
          <Button type="submit" size="sm">Save</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
