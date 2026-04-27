import type { Lead, LeadStatus } from "@/types/database";

export type LeadPriority = "low" | "med" | "high";

export function parseLeadPriority(notes: string | null): LeadPriority {
  if (!notes) return "med";
  const m = notes.match(/Priority:\s*(LOW|MED|HIGH)/i);
  if (!m) return "med";
  const v = m[1]!.toLowerCase();
  if (v === "low" || v === "med" || v === "high") return v;
  return "med";
}

/** Parsed estimated budget from notes (stored value is major units → returned as cents). */
export function parseLeadBudgetCents(notes: string | null): number | null {
  if (!notes) return null;
  let m = notes.match(
    /Estimated budget:\s*(?:USD|INR|EUR|GBP|AUD|CAD|\$|₹|€|£|A\$)?\s*([\d,]+(?:\.\d+)?)/i,
  );
  if (!m) {
    m = notes.match(/Budget\s*\([^)]*\):\s*([\d,]+(?:\.\d+)?)/i);
  }
  if (!m) return null;
  const n = Number(m[1]!.replace(/,/g, ""));
  if (Number.isNaN(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function leadStatusPresentation(status: LeadStatus): { label: string; dot: string } {
  const map = {
    new: { label: "New", dot: "bg-sky-500" },
    contacted: { label: "Contacted", dot: "bg-teal-500" },
    qualified: { label: "Negotiating", dot: "bg-violet-500" },
    lost: { label: "Lost", dot: "bg-neutral-400" },
  } as const;
  return map[status];
}

export function priorityPresentation(p: LeadPriority): { label: string; className: string } {
  const map = {
    high: {
      label: "HIGH",
      className: "bg-rose-50 text-rose-800 border border-rose-200/80",
    },
    med: {
      label: "MED",
      className: "bg-amber-50 text-amber-900 border border-amber-200/80",
    },
    low: {
      label: "LOW",
      className: "bg-sky-50 text-sky-800 border border-sky-200/80",
    },
  } as const;
  return map[p];
}

const TILE_BG = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-indigo-500",
] as const;

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function leadBrandTileClass(company: string | null): string {
  const key = company?.trim() || "?";
  return TILE_BG[hashString(key) % TILE_BG.length]!;
}

export function leadBrandInitial(company: string | null): string {
  const t = (company ?? "?").trim();
  if (!t) return "?";
  return t[0]!.toUpperCase();
}

export function contactInitials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0]! + p[1]![0]!).toUpperCase();
}

const AVATAR_RING = [
  "bg-violet-100 text-violet-800",
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
] as const;

export function contactAvatarRing(name: string): string {
  return AVATAR_RING[hashString(name) % 3]!;
}

export function computeLeadMetrics(leads: Lead[]) {
  let pipelineCents = 0;
  let activeNegotiating = 0;
  let urgentHigh = 0;

  for (const l of leads) {
    if (l.status !== "lost") {
      const cents = parseLeadBudgetCents(l.notes);
      if (cents) pipelineCents += cents;
    }
    if (l.status === "contacted" || l.status === "qualified") {
      activeNegotiating += 1;
    }
    if (l.status !== "lost" && parseLeadPriority(l.notes) === "high") {
      urgentHigh += 1;
    }
  }

  return { pipelineCents, activeNegotiating, urgentHigh };
}

export function leadMatchesSearch(lead: Lead, q: string): boolean {
  if (!q.trim()) return true;
  const n = q.trim().toLowerCase();
  const hay = [lead.name, lead.company, lead.email, lead.source, lead.notes]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(n);
}
