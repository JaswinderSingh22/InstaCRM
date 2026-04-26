"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { deleteLead, updateLead } from "@/app/actions/crm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Lead } from "@/types/database";

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  return (
    <div className="overflow-hidden rounded-md border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-28 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((l) => (
            <TableRow key={l.id} className="group">
              <TableCell>
                <InlineEdit
                  value={l.name}
                  onSave={async (v) => {
                    try {
                      await updateLead(l.id, { name: v });
                      toast.success("Updated");
                      router.refresh();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Error");
                    }
                  }}
                />
              </TableCell>
              <TableCell className="text-muted-foreground">{l.email ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{l.company ?? "—"}</TableCell>
              <TableCell>
                <select
                  defaultValue={l.status}
                  className="rounded border border-border/60 bg-background px-1.5 py-0.5 text-xs"
                  onChange={async (e) => {
                    try {
                      await updateLead(l.id, {
                        status: e.target.value as Lead["status"],
                      });
                      router.refresh();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Error");
                    }
                  }}
                >
                  <option value="new">new</option>
                  <option value="contacted">contacted</option>
                  <option value="qualified">qualified</option>
                  <option value="lost">lost</option>
                </select>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-destructive opacity-0 group-hover:opacity-100"
                  onClick={async () => {
                    if (!confirm("Delete lead?")) return;
                    try {
                      await deleteLead(l.id);
                      toast.success("Deleted");
                      router.refresh();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Error");
                    }
                  }}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InlineEdit({ value, onSave }: { value: string; onSave: (v: string) => Promise<void> }) {
  const [v, setV] = useState(value);
  return (
    <input
      className="w-full min-w-0 border-none bg-transparent text-sm font-medium focus:outline focus:ring-1"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={async () => {
        if (v !== value) await onSave(v);
      }}
    />
  );
}
