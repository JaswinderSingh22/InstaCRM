"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createLead } from "@/app/actions/crm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";

const SOURCES = [
  "Instagram DM",
  "TikTok",
  "Email",
  "Referral",
  "Inbound form",
  "Event",
  "Other",
] as const;

type Priority = "low" | "med" | "high";

function buildNotes(priority: Priority, budgetRaw: string) {
  const parts: string[] = [`Priority: ${priority.toUpperCase()}`];
  const t = budgetRaw.replace(/[$,\s]/g, "");
  if (t && !Number.isNaN(Number(t))) {
    const n = Number(t);
    parts.push(
      `Estimated budget: $${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
    );
  }
  return parts.join("\n");
}

export function AddLeadModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState<Priority>("med");

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 w-full gap-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-indigo-600 px-5 font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-[#4338ca] hover:to-indigo-600 sm:w-auto"
      >
        <Plus className="size-4" />
        Add Lead
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-xl gap-0 border-neutral-200 bg-white p-0 sm:max-w-xl"
          showCloseButton
        >
          <DialogHeader className="space-y-1 border-b border-neutral-100 px-6 py-4 text-left">
            <DialogTitle className="text-lg font-bold text-neutral-900">Add new lead</DialogTitle>
            <DialogDescription className="text-sm text-[#777681]">
              Start a new brand conversation.
            </DialogDescription>
          </DialogHeader>

          <form
            className="px-6 py-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const brand = String(fd.get("company") ?? "").trim();
              const contact = String(fd.get("name") ?? "").trim();
              const source = String(fd.get("source") ?? "").trim();
              const budget = String(fd.get("budget") ?? "").trim();
              if (!brand || !contact) {
                toast.error("Brand name and primary contact are required");
                return;
              }
              setLoading(true);
              try {
                await createLead({
                  name: contact,
                  company: brand,
                  source: source || undefined,
                  status: "new",
                  notes: buildNotes(priority, budget),
                });
                toast.success("Lead created");
                setOpen(false);
                router.refresh();
                (e.target as HTMLFormElement).reset();
                setPriority("med");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to create lead");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-lead-company" className="text-sm font-medium text-neutral-800">
                  Brand name
                </Label>
                <Input
                  id="add-lead-company"
                  name="company"
                  required
                  placeholder="e.g. Nike, Apple, Local cafe"
                  className="h-11 rounded-lg border-neutral-200 bg-[#F8F9FC] text-[15px] focus:bg-white"
                  autoComplete="organization"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="add-lead-name" className="text-sm font-medium text-neutral-800">
                    Primary contact
                  </Label>
                  <Input
                    id="add-lead-name"
                    name="name"
                    required
                    placeholder="Full name"
                    className="h-11 rounded-lg border-neutral-200 bg-[#F8F9FC] text-[15px] focus:bg-white"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-lead-budget" className="text-sm font-medium text-neutral-800">
                    Estimated budget
                  </Label>
                  <div className="relative">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-neutral-500">$</span>
                    <Input
                      id="add-lead-budget"
                      name="budget"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      className="h-11 rounded-lg border-neutral-200 bg-[#F8F9FC] pl-7 text-[15px] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="add-lead-source" className="text-sm font-medium text-neutral-800">
                    Lead source
                  </Label>
                  <select
                    id="add-lead-source"
                    name="source"
                    defaultValue="Instagram DM"
                    className="flex h-11 w-full rounded-lg border border-neutral-200 bg-[#F8F9FC] px-3 text-[15px] text-neutral-900 outline-none focus:border-[#4F46E5] focus:bg-white focus:ring-2 focus:ring-[#4F46E5]/20"
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-neutral-800">Priority</p>
                  <div className="flex gap-1.5">
                    {(
                      [
                        { id: "low" as const, label: "LOW" },
                        { id: "med" as const, label: "MED" },
                        { id: "high" as const, label: "HIGH" },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={cn(
                          "min-h-11 flex-1 rounded-lg border-2 text-xs font-semibold tracking-wide transition",
                          priority === p.id
                            ? "border-[#4F46E5] bg-indigo-50/80 text-[#4F46E5]"
                            : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300",
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4">
              <Button
                type="button"
                variant="ghost"
                className="text-neutral-600 hover:text-neutral-900"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 rounded-lg bg-gradient-to-r from-[#4F46E5] to-indigo-600 px-5 font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-[#4338ca] hover:to-indigo-600"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Create lead profile"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
