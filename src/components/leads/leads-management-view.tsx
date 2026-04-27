"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  LineChart,
  MoreVertical,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Lead, LeadStatus } from "@/types/database";
import { formatMoney } from "@/lib/money";
import {
  computeLeadMetrics,
  contactAvatarRing,
  contactInitials,
  leadBrandInitial,
  leadBrandTileClass,
  leadMatchesSearch,
  leadStatusPresentation,
  parseLeadBudgetCents,
  parseLeadPriority,
  priorityPresentation,
  type LeadPriority,
} from "@/lib/leads-display";
import { deleteLead, updateLead } from "@/app/actions/crm";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddLeadModal } from "@/components/leads/add-lead-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTS: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Negotiating" },
  { value: "lost", label: "Lost" },
];

const PRIORITY_FILTER_OPTS: { value: LeadPriority | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "high", label: "High" },
  { value: "med", label: "Medium" },
  { value: "low", label: "Low" },
];

function exportLeadsCsv(rows: Lead[]) {
  const headers = [
    "Brand",
    "Primary contact",
    "Email",
    "Budget (USD)",
    "Lead source",
    "Status",
    "Priority",
  ];
  const lines = rows.map((l) => {
    const cents = parseLeadBudgetCents(l.notes);
    const budget = cents != null ? (cents / 100).toFixed(2) : "";
    const st = leadStatusPresentation(l.status);
    const pr = priorityPresentation(parseLeadPriority(l.notes));
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    return [
      esc(l.company ?? ""),
      esc(l.name),
      esc(l.email ?? ""),
      budget,
      esc(l.source ?? ""),
      esc(st.label),
      esc(pr.label),
    ].join(",");
  });
  const blob = new Blob([[headers.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type Props = {
  leads: Lead[];
  initialQuery?: string;
};

export function LeadsManagementView({ leads, initialQuery = "" }: Props) {
  const router = useRouter();
  const [searchText, setSearchText] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) {
      if (l.source?.trim()) set.add(l.source.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const metrics = useMemo(() => computeLeadMetrics(leads), [leads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (!leadMatchesSearch(l, searchText)) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (priorityFilter !== "all" && parseLeadPriority(l.notes) !== priorityFilter) return false;
      if (sourceFilter !== "all" && (l.source ?? "").trim() !== sourceFilter) return false;
      return true;
    });
  }, [leads, searchText, statusFilter, priorityFilter, sourceFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount));
  }, [pageCount]);

  const pageSlice = useMemo(() => {
    const p = Math.min(page, pageCount);
    const start = (p - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page, pageCount]);

  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safePage * PAGE_SIZE, filtered.length);

  const pageNumbers = useMemo(
    () => Array.from({ length: pageCount }, (_, i) => i + 1),
    [pageCount],
  );

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSourceFilter("all");
    setPage(1);
  };

  useEffect(() => {
    setSearchText(initialQuery);
    setPage(1);
  }, [initialQuery]);

  const filterSelectClass =
    "h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-neutral-900">
            Leads Management
          </h1>
          <p className="mt-1 max-w-xl text-sm text-neutral-500">
            Track and nurture your brand partnerships and high-value creator leads.
          </p>
        </div>
        <AddLeadModal />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <LineChart className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">Total pipeline</p>
            <p className="text-lg font-bold tabular-nums text-neutral-900">
              {formatMoney(metrics.pipelineCents, "USD")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">Active negotiating</p>
            <p className="text-lg font-bold tabular-nums text-neutral-900">
              {metrics.activeNegotiating}{" "}
              <span className="text-sm font-semibold text-neutral-500">Leads</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Zap className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">Urgent action</p>
            <p className="text-lg font-bold tabular-nums text-neutral-900">
              {metrics.urgentHigh}{" "}
              <span className="text-sm font-semibold text-neutral-500">High priority</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full min-w-0 flex-col gap-2 lg:max-w-md">
          <Input
            type="search"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
            placeholder="Search brands, contacts, sources…"
            className="h-9 rounded-lg border-neutral-200 bg-[#F8F9FC] text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <label className="sr-only" htmlFor="lead-filter-status">
            Status
          </label>
          <select
            id="lead-filter-status"
            className={filterSelectClass}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as LeadStatus | "all");
              setPage(1);
            }}
          >
            {STATUS_FILTER_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                Status: {o.label}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="lead-filter-priority">
            Priority
          </label>
          <select
            id="lead-filter-priority"
            className={filterSelectClass}
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value as LeadPriority | "all");
              setPage(1);
            }}
          >
            {PRIORITY_FILTER_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                Priority: {o.label}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="lead-filter-source">
            Lead source
          </label>
          <select
            id="lead-filter-source"
            className={cn(filterSelectClass, "min-w-[10rem]")}
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Lead source: All</option>
            {sourceOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-[#4F46E5] hover:underline"
          >
            Clear filters
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-2 lg:ml-auto">
          <button
            type="button"
            onClick={() => exportLeadsCsv(filtered)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 gap-1.5 rounded-lg border-sky-200 bg-sky-50/80 text-sky-900 hover:bg-sky-100",
            )}
          >
            <Download className="size-3.5" />
            Export .CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm">
        {leads.length === 0 ? (
          <div className="py-16 text-center text-sm text-neutral-500">
            <p>No leads yet.</p>
            <p className="mt-1">Use &quot;+ Add Lead&quot; above to create your first profile.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-neutral-500">
            <p>No leads match your filters.</p>
            <p className="mt-1">Try clearing filters or adjusting search.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-100 hover:bg-transparent">
                  <TableHead className="w-[220px] text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Brand
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Primary contact
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Budget
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Lead source
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Priority
                  </TableHead>
                  <TableHead className="w-12 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageSlice.map((l) => {
                  const cents = parseLeadBudgetCents(l.notes);
                  const pr = parseLeadPriority(l.notes);
                  const prUi = priorityPresentation(pr);
                  const st = leadStatusPresentation(l.status);
                  const company = l.company?.trim() || "—";
                  const tile = leadBrandTileClass(l.company);
                  const initial = leadBrandInitial(l.company);
                  return (
                    <TableRow key={l.id} className="border-neutral-100">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm",
                              tile,
                            )}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-neutral-900">{company}</p>
                            <p className="truncate text-xs text-neutral-500">
                              {l.source ? `via ${l.source}` : "Brand outreach"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                              contactAvatarRing(l.name),
                            )}
                          >
                            {contactInitials(l.name)}
                          </div>
                          <span className="font-medium text-neutral-800">{l.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums text-neutral-800">
                        {cents != null ? formatMoney(cents, "USD") : "—"}
                      </TableCell>
                      <TableCell className="text-neutral-600">
                        {l.source ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                          <span className="inline-flex items-center gap-1.5 text-sm text-neutral-800">
                            <span className={cn("size-2 shrink-0 rounded-full", st.dot)} />
                            {st.label}
                          </span>
                          <select
                            className="max-w-[9.5rem] rounded-md border border-neutral-200 bg-[#F8F9FC] px-2 py-1 text-xs text-neutral-800"
                            value={l.status}
                            onChange={async (e) => {
                              try {
                                await updateLead(l.id, {
                                  status: e.target.value as LeadStatus,
                                });
                                router.refresh();
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Error");
                              }
                            }}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Negotiating</option>
                            <option value="lost">Lost</option>
                          </select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide",
                            prUi.className,
                          )}
                        >
                          {prUi.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                            aria-label="Row actions"
                          >
                            <MoreVertical className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-rose-600"
                              onClick={async () => {
                                if (!confirm("Delete this lead?")) return;
                                try {
                                  await deleteLead(l.id);
                                  toast.success("Deleted");
                                  router.refresh();
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Error");
                                }
                              }}
                            >
                              Delete lead
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-neutral-500">
                Showing {showingFrom} to {showingTo} of {filtered.length} leads
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-8 rounded-lg px-3 text-xs disabled:opacity-40",
                  )}
                >
                  Previous
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={cn(
                      buttonVariants({ variant: n === safePage ? "default" : "outline", size: "sm" }),
                      "h-8 min-w-8 rounded-lg px-2 text-xs",
                      n === safePage &&
                        "border-0 bg-gradient-to-r from-[#4F46E5] to-indigo-600 text-white",
                    )}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-8 rounded-lg px-3 text-xs disabled:opacity-40",
                  )}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#4c1d95] via-[#5b21b6] to-indigo-900 p-6 text-white shadow-lg">
          <div>
            <h2 className="text-lg font-bold">Campaign ready?</h2>
            <p className="mt-2 max-w-sm text-sm text-violet-100/90">
              Review open deals and contracts before you kick off the next creator wave.
            </p>
          </div>
          <Link
            href="/deals"
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "mt-6 w-fit rounded-xl border-0 bg-white font-semibold text-violet-900 hover:bg-violet-50",
            )}
          >
            Review contracts
          </Link>
        </div>
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900">Lead growth</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Your lead acquisition is up 24% compared to last month.
          </p>
          <div className="mt-6 flex h-28 items-end justify-between gap-2 px-1">
            {[40, 55, 48, 72, 65, 88, 92].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-sky-200 to-sky-500"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
