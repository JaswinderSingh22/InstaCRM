"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { Download, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { deleteBrand } from "@/app/actions/crm";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BrandActivity, BrandContact, BrandContactStatus } from "@/types/database";
import type { BrandWithMetrics } from "@/lib/data/brands-page";
import { buttonVariants } from "@/components/ui/button";
import { PageFade } from "@/components/layout/page-fade";
import { BrandForm } from "@/components/brands/brand-form";
import {
  AddPartnerContactDialog,
  AddRelationshipEventDialog,
} from "@/components/brands/brand-engagement-dialogs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ContactSort = "contacted" | "name" | "brand";

type Props = {
  brandRows: BrandWithMetrics[];
  contacts: BrandContact[];
  activities: BrandActivity[];
  brandNameById: Record<string, string>;
  initialQuery?: string;
};

function initialTwo(s: string) {
  const p = s.trim().split(/\s+/);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0]! + p[1]![0]!).toUpperCase();
}

const AVATAR = [
  "bg-violet-100 text-violet-800",
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
] as const;

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function ContactAvatar({ name, i }: { name: string; i: number }) {
  return (
    <div
      className={cn(
        "flex size-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold",
        AVATAR[i % 3]!,
      )}
      style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i }}
    >
      {initialTwo(name)}
    </div>
  );
}

function shortRevenue(cents: number) {
  const v = cents / 100;
  if (v >= 1000) {
    return `$${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return formatMoney(cents, "USD");
}

function statusTone(
  t: "green" | "orange" | "blue" | "neutral",
): { bg: string; text: string; dot: string } {
  const m = {
    green: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
    orange: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500" },
    blue: { bg: "bg-sky-50", text: "text-sky-800", dot: "bg-sky-500" },
    neutral: { bg: "bg-neutral-100", text: "text-neutral-700", dot: "bg-neutral-400" },
  } as const;
  return m[t];
}

const contactStatusStyle: Record<
  BrandContactStatus,
  { label: string; className: string }
> = {
  active: { label: "ACTIVE", className: "bg-emerald-50 text-emerald-800" },
  pending: { label: "PENDING", className: "bg-amber-50 text-amber-800" },
  inactive: { label: "INACTIVE", className: "bg-neutral-100 text-neutral-600" },
};

const activityColor: Record<BrandActivity["kind"], string> = {
  email: "bg-sky-500",
  payment: "bg-emerald-500",
  contract: "bg-amber-500",
  meeting: "bg-violet-500",
  note: "bg-neutral-400",
};

function filterByQuery(
  b: BrandWithMetrics[],
  contacts: BrandContact[],
  q: string,
  brandNameById: Record<string, string>,
) {
  const s = q.trim().toLowerCase();
  if (!s) return { brands: b, contacts };
  return {
    brands: b.filter(
      (r) =>
        r.name.toLowerCase().includes(s) ||
        (r.industry && r.industry.toLowerCase().includes(s)) ||
        (r.description && r.description.toLowerCase().includes(s)),
    ),
    contacts: contacts.filter((c) => {
      const brandName = (brandNameById[c.brand_id] || "").toLowerCase();
      return (
        c.name.toLowerCase().includes(s) ||
        (c.email && c.email.toLowerCase().includes(s)) ||
        (c.role && c.role.toLowerCase().includes(s)) ||
        brandName.includes(s)
      );
    }),
  };
}

function exportBrandsReport(brands: BrandWithMetrics[]) {
  const header = "Brand,Status,Revenue (USD),Deals,Avg pay (d)";
  const lines = brands.map((b) => {
    const r = (b.metrics.revenueCents / 100).toFixed(2);
    const a = b.metrics.avgPayDays ?? "—";
    return [b.name, b.partnership.label, r, String(b.metrics.dealCount), String(a)]
      .map((c) => `"${String(c).replaceAll('"', '""')}"`)
      .join(",");
  });
  const blob = new Blob([header + "\n" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `instacrm-brands-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function BrandsPartnershipsView({
  brandRows,
  contacts,
  activities,
  brandNameById,
  initialQuery = "",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? initialQuery;
  const [contactSort, setContactSort] = useState<ContactSort>("contacted");
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [activityPresetBrandId, setActivityPresetBrandId] = useState<string | null>(null);

  const brandOptions = useMemo(
    () => brandRows.map((b) => ({ id: b.id, name: b.name })),
    [brandRows],
  );

  const { brands, contacts: cFiltered } = useMemo(
    () => filterByQuery(brandRows, contacts, q, brandNameById),
    [brandRows, contacts, q, brandNameById],
  );

  // fix typo: brandRow -> brandRows
  const sortedContacts = useMemo(() => {
    const copy = [...cFiltered];
    if (contactSort === "name") {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    } else if (contactSort === "brand") {
      copy.sort(
        (a, b) =>
          (brandNameById[a.brand_id] || "").localeCompare(brandNameById[b.brand_id] || "") ||
          a.name.localeCompare(b.name),
      );
    } else {
      copy.sort((a, b) => {
        const ta = a.last_contacted_at ? new Date(a.last_contacted_at).getTime() : 0;
        const tb = b.last_contacted_at ? new Date(b.last_contacted_at).getTime() : 0;
        return tb - ta;
      });
    }
    return copy;
  }, [cFiltered, contactSort, brandNameById]);

  const onDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this brand? Deals may lose the brand link.")) return;
      try {
        await deleteBrand(id);
        toast.success("Brand removed");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    },
    [router],
  );

  const byBrandContacts = useCallback(
    (brandId: string) => sortedContacts.filter((c) => c.brand_id === brandId).slice(0, 3),
    [sortedContacts],
  );

  return (
    <PageFade>
      <AddRelationshipEventDialog
        open={activityDialogOpen}
        onOpenChange={(o) => {
          setActivityDialogOpen(o);
          if (!o) setActivityPresetBrandId(null);
        }}
        brands={brandOptions}
        initialBrandId={activityPresetBrandId}
      />
      <AddPartnerContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        brands={brandOptions}
      />
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Brand partnerships</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Manage your high-value relationships and track performance metrics.
            </p>
            {q.trim() && (
              <p className="mt-1 text-xs text-neutral-500">
                Filtered: “{q}” —{" "}
                <Link href="/brands" className="text-[#4F46E5] hover:underline">
                  clear
                </Link>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportBrandsReport(brands)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 gap-1.5 rounded-lg",
              )}
            >
              <Download className="size-3.5" />
              Export report
            </button>
            <BrandForm />
          </div>
        </div>

        {brands.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white/60 py-16 text-center text-sm text-neutral-500">
            <p>No brands yet. Use &quot;Add brand&quot; above to create your first partnership.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((b) => {
              const t = statusTone(b.partnership.tone);
              const keyPeople = byBrandContacts(b.id);
              return (
                <div
                  key={b.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm"
                >
                  <div className="flex items-start justify-between border-b border-neutral-100 p-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-700"
                        style={b.color ? { background: b.color, color: "#fff" } : undefined}
                      >
                        {initialTwo(b.name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-neutral-900">{b.name}</h3>
                        <p className="truncate text-xs text-neutral-500">
                          {b.industry || "Brand partner"}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                        aria-label="Actions"
                      >
                        <MoreVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-rose-600"
                          onClick={() => onDelete(b.id)}
                        >
                          Remove brand
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold",
                        t.bg,
                        t.text,
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", t.dot)} />
                      {b.partnership.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
                    {[
                      { k: "Total revenue", v: shortRevenue(b.metrics.revenueCents) },
                      { k: "Deals", v: String(b.metrics.dealCount) },
                      {
                        k: "Avg pay",
                        v:
                          b.metrics.avgPayDays != null ? `${b.metrics.avgPayDays}d` : "—",
                      },
                    ].map((cell) => (
                      <div
                        key={cell.k}
                        className="rounded-lg border border-sky-100/80 bg-sky-50/50 px-1.5 py-2 text-center"
                      >
                        <p className="text-[9px] font-semibold uppercase text-neutral-500">
                          {cell.k}
                        </p>
                        <p className="text-sm font-bold text-neutral-900">{cell.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-neutral-100 px-3 py-2">
                    <div className="mb-0.5 flex items-center justify-between text-[10px] font-bold uppercase text-neutral-500">
                      <span>Communication notes</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActivityPresetBrandId(b.id);
                          setActivityDialogOpen(true);
                        }}
                        className="text-[#4F46E5] hover:underline"
                      >
                        Add note
                      </button>
                    </div>
                    <blockquote className="mt-0.5 border-l-2 border-violet-200 pl-2 text-xs leading-relaxed text-neutral-600">
                      {b.description ||
                        "Prefers short briefs, responds quickly on Tuesday mornings, prioritizes UGC and aesthetic consistency."}
                    </blockquote>
                  </div>
                  <div className="flex-1 border-t border-neutral-100 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-neutral-500">Key contacts</p>
                    <div className="mt-1 flex pl-0">
                      {keyPeople.length === 0 ? (
                        <p className="text-xs text-neutral-400">Add contacts in database</p>
                      ) : (
                        <div className="flex -space-x-1">
                          {keyPeople.map((c, i) => (
                            <ContactAvatar key={c.id} name={c.name} i={i} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-sm font-bold text-neutral-900">Contact directory</h2>
                {brandOptions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setContactDialogOpen(true)}
                    className="text-xs font-medium text-[#4F46E5] hover:underline"
                  >
                    Add contact
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>Sort by:</span>
                <Select value={contactSort} onValueChange={(v) => setContactSort(v as ContactSort)}>
                  <SelectTrigger className="h-8 w-[200px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contacted">Recently contacted</SelectItem>
                    <SelectItem value="name">Name (A–Z)</SelectItem>
                    <SelectItem value="brand">Brand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/80 text-left text-xs font-bold tracking-wide text-neutral-500">
                      <th className="px-3 py-2.5">Contact</th>
                      <th className="px-3 py-2.5">Brand</th>
                      <th className="px-3 py-2.5">Role</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedContacts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-xs text-neutral-500">
                          {contacts.length === 0
                            ? "No contacts yet. Use Add contact or run the latest seed migration for demo data."
                            : "No contacts match your search."}
                        </td>
                      </tr>
                    ) : (
                      sortedContacts.map((c) => {
                        const st = contactStatusStyle[c.status] ?? contactStatusStyle.active;
                        return (
                          <tr
                            key={c.id}
                            className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60"
                          >
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "flex size-8 items-center justify-center rounded-full text-[10px] font-bold",
                                    AVATAR[hash(c.id) % 3]!,
                                  )}
                                >
                                  {initialTwo(c.name)}
                                </div>
                                <div>
                                  <p className="font-semibold text-neutral-900">{c.name}</p>
                                  {c.email && (
                                    <p className="text-xs text-neutral-500">{c.email}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-neutral-800">
                              {brandNameById[c.brand_id] || "—"}
                            </td>
                            <td className="px-3 py-2.5 text-neutral-600">{c.role || "—"}</td>
                            <td className="px-3 py-2.5">
                              <span
                                className={cn(
                                  "rounded-md px-2 py-0.5 text-[10px] font-bold",
                                  st.className,
                                )}
                              >
                                {st.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold text-neutral-900">Relationship activity</h2>
              {brandOptions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActivityPresetBrandId(null);
                    setActivityDialogOpen(true);
                  }}
                  className="text-xs font-medium text-[#4F46E5] hover:underline"
                >
                  Add event
                </button>
              )}
            </div>
            <div className="max-h-[480px] overflow-y-auto rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
              <ul className="space-y-0">
                {activities.length === 0 ? (
                  <li className="py-4 text-center text-sm text-neutral-500">No recent activity</li>
                ) : (
                  activities.map((a) => (
                    <li key={a.id} className="flex gap-3 border-b border-neutral-100 py-3 last:border-0">
                      <div className="pt-0.5">
                        <span
                          className={cn(
                            "block size-2.5 rounded-full",
                            activityColor[a.kind] || "bg-neutral-400",
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-neutral-500">
                          {format(new Date(a.occurred_at), "MMM d, yyyy h:mm a")} ·{" "}
                          {formatDistanceToNow(new Date(a.occurred_at), { addSuffix: true })}
                        </p>
                        <p className="text-sm font-semibold text-neutral-900">{a.title}</p>
                        {a.body && <p className="mt-0.5 text-xs text-neutral-600">{a.body}</p>}
                        {a.amount_cents != null && a.kind === "payment" && (
                          <p className="mt-0.5 text-sm font-bold text-emerald-700">
                            {formatMoney(a.amount_cents, "USD")}
                          </p>
                        )}
                        <p className="text-[10px] text-neutral-400">
                          {brandNameById[a.brand_id]}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="relative mt-10 border-t border-neutral-200/80 pt-4">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-neutral-600">
              <span className="font-semibold text-neutral-800">InstaCRM</span> — ©{" "}
              {new Date().getFullYear()} InstaCRM. Built for Creators.
            </p>
            {/* <nav className="flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-500">
              <a href="#" className="hover:text-[#4F46E5]">Privacy</a>
              <a href="#" className="hover:text-[#4F46E5]">Terms</a>
              <a href="#" className="hover:text-[#4F46E5]">API</a>
              <a href="#" className="hover:text-[#4F46E5]">Careers</a>
            </nav> */}
          </div>
        </div>
      </div>
    </PageFade>
  );
}
