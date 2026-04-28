"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateLead } from "@/app/actions/crm";
import type { Lead, LeadStatus } from "@/types/database";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Props = {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditLeadDialog({ lead, open, onOpenChange }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<LeadStatus>("new");

  useEffect(() => {
    if (!lead || !open) return;
    setName(lead.name);
    setCompany(lead.company ?? "");
    setEmail(lead.email ?? "");
    setSource(lead.source ?? "");
    setNotes(lead.notes ?? "");
    setStatus(lead.status);
  }, [lead, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-neutral-200 bg-white" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">Edit lead</DialogTitle>
          <DialogDescription>Update the brand contact and internal notes.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!lead) return;
            if (!name.trim() || !company.trim()) {
              toast.error("Brand and contact name are required");
              return;
            }
            setLoading(true);
            try {
              await updateLead(lead.id, {
                name: name.trim(),
                company: company.trim() || null,
                email: email.trim() || null,
                source: source.trim() || null,
                notes: notes.trim() || null,
                status,
              });
              toast.success("Lead updated");
              onOpenChange(false);
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Error");
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="el-company">Brand / company</Label>
            <Input
              id="el-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="el-name">Primary contact</Label>
            <Input
              id="el-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="el-email">Email</Label>
            <Input
              id="el-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="el-source">Source</Label>
            <Input
              id="el-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="el-status">Status</Label>
            <select
              id="el-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
              className="flex h-10 w-full rounded-lg border border-neutral-200 bg-[#F8F9FC] px-3 text-sm"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Negotiating</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="el-notes">Notes</Label>
            <Textarea
              id="el-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="rounded-lg border-neutral-200 bg-[#F8F9FC] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#4F46E5] text-white hover:bg-[#4338ca]">
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
