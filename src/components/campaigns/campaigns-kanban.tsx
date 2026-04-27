"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DragDropContext,
  type DropResult,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import { format } from "date-fns";
import { ExternalLink, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Campaign, CampaignStatus } from "@/types/database";
import { moveCampaign, deleteCampaign } from "@/app/actions/campaigns";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STAGES: { id: CampaignStatus; label: string; dot: string }[] = [
  { id: "inbox", label: "Inbox", dot: "bg-slate-400" },
  { id: "applied", label: "Applied", dot: "bg-blue-500" },
  { id: "shortlisted", label: "Shortlisted", dot: "bg-violet-500" },
  { id: "in_progress", label: "In progress", dot: "bg-amber-500" },
  { id: "posted", label: "Posted", dot: "bg-sky-500" },
  { id: "completed", label: "Done", dot: "bg-emerald-500" },
  { id: "passed", label: "Passed", dot: "bg-rose-500" },
];

type Props = {
  initial: Campaign[];
  onAddCampaign: (status: CampaignStatus) => void;
};

function deliverablesList(d: Campaign): string[] {
  const raw = d.deliverables;
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  return [];
}

function reorderCampaigns(
  prev: Campaign[],
  id: string,
  fromStatus: CampaignStatus,
  toStatus: CampaignStatus,
  destIndex: number,
): Campaign[] {
  const moving = prev.find((x) => x.id === id);
  if (!moving) return prev;
  const rest = prev.filter((x) => x.id !== id);

  if (fromStatus === toStatus) {
    const inCol = rest
      .filter((x) => x.status === fromStatus)
      .sort((a, b) => a.position - b.position);
    inCol.splice(destIndex, 0, { ...moving, status: fromStatus });
    const re = inCol.map((x, i) => ({ ...x, position: i * 10, status: fromStatus as CampaignStatus }));
    return rest.filter((x) => x.status !== fromStatus).concat(re);
  }

  const inFrom = rest
    .filter((x) => x.status === fromStatus)
    .sort((a, b) => a.position - b.position);
  const inTo = rest
    .filter((x) => x.status === toStatus)
    .sort((a, b) => a.position - b.position);
  inTo.splice(destIndex, 0, { ...moving, status: toStatus });
  const rFrom = inFrom.map((x, i) => ({ ...x, position: i * 10 }));
  const rTo = inTo.map((x, i) => ({ ...x, position: i * 10, status: toStatus as CampaignStatus }));
  return rest
    .filter((x) => x.status !== fromStatus && x.status !== toStatus)
    .concat(rFrom, rTo);
}

function CampaignCard({ d, isDragging }: { d: Campaign; isDragging: boolean }) {
  const dels = deliverablesList(d);
  const sub = [d.brand_name, d.agency_name].filter(Boolean).join(" · ") || null;
  const dateBits: string[] = [];
  if (d.shoot_date) dateBits.push(`Shoot ${format(new Date(d.shoot_date + "T12:00:00"), "MMM d")}`);
  if (d.post_date) {
    const end = d.post_date_end && d.post_date_end !== d.post_date;
    dateBits.push(
      end
        ? `Post ${format(new Date(d.post_date + "T12:00:00"), "MMM d")}–${format(new Date(d.post_date_end! + "T12:00:00"), "MMM d")}`
        : `Post ${format(new Date(d.post_date + "T12:00:00"), "MMM d")}`,
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm transition",
        isDragging && "border-indigo-300 shadow-lg ring-2 ring-indigo-200/60",
      )}
    >
      <h3 className="line-clamp-2 font-semibold text-[15px] leading-snug text-neutral-950">{d.title}</h3>
      {sub ? <p className="mt-1 line-clamp-1 text-xs text-neutral-500">{sub}</p> : null}
      {d.compensation_summary ? (
        <p className="mt-1.5 text-sm font-medium text-neutral-800">{d.compensation_summary}</p>
      ) : d.compensation_cents != null && d.compensation_cents > 0 ? (
        <p className="mt-1.5 text-sm font-semibold tabular-nums text-[#4F46E5]">
          {formatMoney(d.compensation_cents, d.currency)}
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-neutral-400">
          {d.compensation_type === "barter" ? "Barter / product" : "Compensation TBD"}
        </p>
      )}
      {dateBits.length > 0 ? (
        <p className="mt-1 text-xs text-neutral-500">{dateBits.join(" · ")}</p>
      ) : null}
      {d.location_notes ? (
        <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{d.location_notes}</p>
      ) : null}
      {dels.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-[11px] text-neutral-600">
          {dels.slice(0, 3).map((x) => (
            <li key={x} className="line-clamp-1">
              {x}
            </li>
          ))}
          {dels.length > 3 ? <li className="text-neutral-400">+{dels.length - 3} more</li> : null}
        </ul>
      ) : null}
      {d.apply_url ? (
        <Link
          href={d.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#4F46E5] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Apply / brief <ExternalLink className="size-3" />
        </Link>
      ) : null}
      {(d.linked_lead_id || d.linked_brand_id) && (
        <p className="mt-2 text-[10px] font-medium text-emerald-700">
          Linked to Creators{Boolean(d.linked_brand_id) ? " · Brands" : ""} · tasks on Calendar
        </p>
      )}
    </div>
  );
}

export function CampaignsKanban({ initial, onAddCampaign }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Campaign[]>(initial);
  useEffect(() => {
    setRows(initial);
  }, [initial]);

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      const snapshot = rows;
      const id = String(draggableId);
      const fromStatus = source.droppableId as CampaignStatus;
      const toStatus = destination.droppableId as CampaignStatus;
      const next = reorderCampaigns(snapshot, id, fromStatus, toStatus, destination.index);
      setRows(next);

      const inFrom = next.filter((d) => d.status === fromStatus).sort((a, b) => a.position - b.position);
      const inTo = next.filter((d) => d.status === toStatus).sort((a, b) => a.position - b.position);
      const touched = new Map<string, Campaign>();
      for (const d of inFrom) touched.set(d.id, d);
      for (const d of inTo) touched.set(d.id, d);
      const updates = [...touched.values()].filter((d) => {
        const o = snapshot.find((p) => p.id === d.id);
        return !o || o.status !== d.status || o.position !== d.position;
      });

      try {
        await Promise.all(
          updates.map((d) => moveCampaign({ id: d.id, status: d.status, position: d.position })),
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not save");
        setRows(snapshot);
      }
    },
    [rows],
  );

  const byStatus = useMemo(() => {
    const m: Record<CampaignStatus, Campaign[]> = {
      inbox: [],
      applied: [],
      shortlisted: [],
      in_progress: [],
      posted: [],
      completed: [],
      passed: [],
    };
    for (const d of rows) m[d.status].push(d);
    (Object.keys(m) as CampaignStatus[]).forEach((k) =>
      m[k].sort((a, b) => a.position - b.position),
    );
    return m;
  }, [rows]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="-mx-1 flex touch-pan-x snap-x snap-mandatory gap-3 overflow-x-auto scroll-pb-2 scroll-pl-3 scroll-pr-3 px-1 pb-4 pt-1 [-ms-overflow-style:none] [scrollbar-width:thin] sm:gap-4 sm:scroll-pl-4 sm:scroll-pr-4 md:mx-0 md:gap-3 md:scroll-px-0 md:px-0 md:pb-6 [&::-webkit-scrollbar]:h-2">
        {STAGES.map((col) => (
          <Column
            key={col.id}
            col={col}
            campaigns={byStatus[col.id]}
            onAddCampaign={onAddCampaign}
            onDeleted={() => router.refresh()}
          />
        ))}
      </div>
    </DragDropContext>
  );
}

function Column({
  col,
  campaigns,
  onAddCampaign,
  onDeleted,
}: {
  col: (typeof STAGES)[number];
  campaigns: Campaign[];
  onAddCampaign: (status: CampaignStatus) => void;
  onDeleted: () => void;
}) {
  return (
    <div className="flex w-[min(280px,calc(100vw-2.5rem))] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm sm:w-[min(292px,82vw)]">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200/80 px-2.5 py-2 sm:px-3 sm:py-2.5">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <span className={cn("size-2 shrink-0 rounded-full", col.dot)} aria-hidden />
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-neutral-950 sm:text-[12px]">
            {col.label}
          </h2>
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-100 px-1.5 text-[11px] font-semibold tabular-nums text-neutral-600">
            {campaigns.length}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-neutral-500 hover:bg-neutral-100 hover:text-[#4F46E5]"
            aria-label={`Add to ${col.label}`}
            onClick={() => onAddCampaign(col.id)}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
      <Droppable droppableId={col.id} direction="vertical">
        {(prov, snap) => (
          <div
            ref={prov.innerRef}
            {...prov.droppableProps}
            className="max-h-[min(58dvh,640px)] min-h-[11rem] flex-1 space-y-2.5 overflow-y-auto overscroll-y-contain p-2 sm:max-h-[min(70dvh,780px)] sm:min-h-40 sm:space-y-3 sm:p-2.5"
          >
            {campaigns.map((d, i) => (
              <Draggable key={d.id} draggableId={d.id} index={i}>
                {(p, s) => (
                  <div
                    ref={p.innerRef}
                    {...p.draggableProps}
                    className="group relative touch-manipulation active:cursor-grabbing"
                  >
                    <div {...p.dragHandleProps}>
                      <CampaignCard d={d} isDragging={s.isDragging} />
                    </div>
                    <div className="pointer-events-none absolute top-2 right-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 sm:group-hover:opacity-100 [&_button]:pointer-events-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex size-7 items-center justify-center rounded-md border border-neutral-200/80 bg-white/95 text-neutral-700 shadow-sm outline-none hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[#4F46E5]/25"
                          aria-label="Campaign actions"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            className="gap-2 text-rose-600"
                            onClick={async (e) => {
                              e.preventDefault();
                              if (!confirm("Remove this campaign from the board?")) return;
                              try {
                                await deleteCampaign(d.id);
                                toast.success("Removed");
                                onDeleted();
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Error");
                              }
                            }}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {prov.placeholder}
            {snap.isDraggingOver && !campaigns.length ? (
              <p className="py-6 text-center text-xs text-neutral-400">Drop here</p>
            ) : null}
          </div>
        )}
      </Droppable>
    </div>
  );
}
