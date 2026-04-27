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
import { createCampaign, parseBriefWithAi } from "@/app/actions/campaigns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import type { ParsedCampaignBrief } from "@/lib/openai/parse-campaign-brief";
import type { CampaignCompensationType, CampaignStatus } from "@/types/database";
import { normalizeWorkspaceCurrency } from "@/lib/currency";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: CampaignStatus;
  defaultCurrency: string;
};

const COMP_TYPES: { id: CampaignCompensationType; label: string }[] = [
  { id: "unknown", label: "Not sure" },
  { id: "cash", label: "Cash / fee" },
  { id: "barter", label: "Barter / product only" },
  { id: "mixed", label: "Cash + product" },
];

export function AddCampaignModal({
  open,
  onOpenChange,
  defaultStatus = "inbox",
  defaultCurrency,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [paste, setPaste] = useState("");
  const [title, setTitle] = useState("");
  const [brandName, setBrandName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [compSummary, setCompSummary] = useState("");
  const [compCents, setCompCents] = useState("");
  const [compType, setCompType] = useState<CampaignCompensationType>("unknown");
  const [deliverablesText, setDeliverablesText] = useState("");
  const [shootDate, setShootDate] = useState("");
  const [postDate, setPostDate] = useState("");
  const [postDateEnd, setPostDateEnd] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [locationNotes, setLocationNotes] = useState("");
  const [requirementsNotes, setRequirementsNotes] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [status, setStatus] = useState<CampaignStatus>(defaultStatus);

  useEffect(() => {
    if (open) {
      setStatus(defaultStatus);
      setCurrency(defaultCurrency);
    }
  }, [open, defaultStatus, defaultCurrency]);

  const resetForm = () => {
    setPaste("");
    setTitle("");
    setBrandName("");
    setAgencyName("");
    setCompSummary("");
    setCompCents("");
    setCompType("unknown");
    setDeliverablesText("");
    setShootDate("");
    setPostDate("");
    setPostDateEnd("");
    setApplyUrl("");
    setLocationNotes("");
    setRequirementsNotes("");
    setCurrency(defaultCurrency);
  };

  const applyParsed = (p: ParsedCampaignBrief) => {
    if (p.title) setTitle(p.title);
    if (p.brand_name) setBrandName(p.brand_name);
    if (p.agency_name) setAgencyName(p.agency_name);
    if (p.compensation_summary) setCompSummary(p.compensation_summary);
    if (p.compensation_cents != null) setCompCents(String(Math.round(p.compensation_cents / 100)));
    if (p.compensation_type) setCompType(p.compensation_type);
    if (p.deliverables?.length) setDeliverablesText(p.deliverables.join("\n"));
    if (p.shoot_date) setShootDate(p.shoot_date);
    if (p.post_date) setPostDate(p.post_date);
    if (p.post_date_end) setPostDateEnd(p.post_date_end);
    if (p.apply_url) setApplyUrl(p.apply_url);
    if (p.location_notes) setLocationNotes(p.location_notes);
    if (p.requirements_notes) setRequirementsNotes(p.requirements_notes);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-neutral-200 bg-white sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">New campaign</DialogTitle>
          <DialogDescription>
            Paste a WhatsApp brief and use AI to fill fields, or enter details manually.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-paste">Paste brief</Label>
            <Textarea
              id="campaign-paste"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder="Paste the full message from WhatsApp or email…"
              rows={4}
              className="resize-y rounded-lg border-neutral-200 bg-[#F8F9FC] text-sm"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-indigo-200 bg-indigo-50/50 text-indigo-900 hover:bg-indigo-50"
              disabled={parsing || !paste.trim()}
              onClick={async () => {
                setParsing(true);
                try {
                  const parsed = await parseBriefWithAi(paste);
                  applyParsed(parsed);
                  toast.success("Fields filled — review and save");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not parse brief");
                } finally {
                  setParsing(false);
                }
              }}
            >
              {parsing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Extract with AI
            </Button>
            <p className="text-[11px] text-neutral-500">
              Needs <code className="rounded bg-neutral-100 px-1">OPENAI_API_KEY</code> in your server env. You can
              still add campaigns manually.
            </p>
          </div>

          <div className="border-t border-neutral-100 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Details</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-title">Title</Label>
                <Input
                  id="c-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                  placeholder="Campaign name"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="c-brand">Brand</Label>
                  <Input
                    id="c-brand"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-agency">Agency</Label>
                  <Input
                    id="c-agency"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-comp">Compensation (summary)</Label>
                <Input
                  id="c-comp"
                  value={compSummary}
                  onChange={(e) => setCompSummary(e.target.value)}
                  placeholder="e.g. ₹2,200 per creator"
                  className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="c-amt">Amount (major units)</Label>
                  <Input
                    id="c-amt"
                    value={compCents}
                    onChange={(e) => setCompCents(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="2200"
                    inputMode="decimal"
                    className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                  />
                  <p className="text-[10px] text-neutral-500">Optional. Stored with currency below.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-curr">Currency</Label>
                  <Input
                    id="c-curr"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
                    className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-ctype">Compensation type</Label>
                <select
                  id="c-ctype"
                  value={compType}
                  onChange={(e) => setCompType(e.target.value as CampaignCompensationType)}
                  className="flex h-10 w-full rounded-lg border border-neutral-200 bg-[#F8F9FC] px-3 text-sm"
                >
                  {COMP_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-del">Deliverables (one per line)</Label>
                <Textarea
                  id="c-del"
                  value={deliverablesText}
                  onChange={(e) => setDeliverablesText(e.target.value)}
                  rows={3}
                  className="rounded-lg border-neutral-200 bg-[#F8F9FC] text-sm"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c-shoot">Shoot date</Label>
                  <Input
                    id="c-shoot"
                    type="date"
                    value={shootDate}
                    onChange={(e) => setShootDate(e.target.value)}
                    className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-post">Post date</Label>
                  <Input
                    id="c-post"
                    type="date"
                    value={postDate}
                    onChange={(e) => setPostDate(e.target.value)}
                    className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-postend">Post end</Label>
                  <Input
                    id="c-postend"
                    type="date"
                    value={postDateEnd}
                    onChange={(e) => setPostDateEnd(e.target.value)}
                    className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-url">Apply link</Label>
                <Input
                  id="c-url"
                  value={applyUrl}
                  onChange={(e) => setApplyUrl(e.target.value)}
                  placeholder="https://…"
                  className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-loc">Location / audience</Label>
                <Input
                  id="c-loc"
                  value={locationNotes}
                  onChange={(e) => setLocationNotes(e.target.value)}
                  className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-req">Requirements & notes</Label>
                <Textarea
                  id="c-req"
                  value={requirementsNotes}
                  onChange={(e) => setRequirementsNotes(e.target.value)}
                  rows={2}
                  className="rounded-lg border-neutral-200 bg-[#F8F9FC] text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-status">Starting column</Label>
                <select
                  id="c-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                  className="flex h-10 w-full rounded-lg border border-neutral-200 bg-[#F8F9FC] px-3 text-sm"
                >
                  <option value="inbox">Inbox (captured)</option>
                  <option value="applied">Applied</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="in_progress">In progress</option>
                  <option value="posted">Posted</option>
                  <option value="completed">Done</option>
                  <option value="passed">Passed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={loading || !title.trim()}
              className="bg-gradient-to-r from-[#4F46E5] to-indigo-600 text-white"
              onClick={async () => {
                const dollars = compCents.replace(/,/g, "");
                const major = Number(dollars);
                const compensation_cents =
                  Number.isFinite(major) && major > 0 ? Math.round(major * 100) : null;
                const lines = deliverablesText
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean);
                setLoading(true);
                try {
                  await createCampaign({
                    title: title.trim(),
                    status,
                    brand_name: brandName || null,
                    agency_name: agencyName || null,
                    compensation_summary: compSummary || null,
                    compensation_cents,
                    compensation_type: compType,
                    deliverables: lines,
                    shoot_date: shootDate || null,
                    post_date: postDate || null,
                    post_date_end: postDateEnd || null,
                    apply_url: applyUrl || null,
                    location_notes: locationNotes || null,
                    requirements_notes: requirementsNotes || null,
                    source_message: paste.trim() || null,
                    currency: normalizeWorkspaceCurrency(currency || defaultCurrency),
                  });
                  toast.success("Campaign saved");
                  resetForm();
                  onOpenChange(false);
                  router.refresh();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to save");
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Save campaign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
