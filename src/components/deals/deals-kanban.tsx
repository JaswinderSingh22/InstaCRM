"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DragDropContext,
  type DraggableProvidedDragHandleProps,
  type DropResult,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Deal, DealStage } from "@/types/database";
import { moveDeal } from "@/app/actions/crm";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";
import {
  MessageCircle,
  Paperclip,
  History,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const STAGES: { id: DealStage; label: string; dot: string }[] = [
  { id: "lead", label: "New inquiry", dot: "bg-blue-500" },
  { id: "qualified", label: "Qualified", dot: "bg-slate-500" },
  { id: "proposal", label: "Proposal sent", dot: "bg-violet-500" },
  { id: "negotiation", label: "Negotiating", dot: "bg-amber-500" },
  { id: "won", label: "Won", dot: "bg-emerald-500" },
  { id: "lost", label: "Lost", dot: "bg-rose-500" },
];

const TAG_PRESETS = [
  ["#Campaign", "Story"],
  ["#Fitness", "Sponsored"],
  ["#Luxury", "Priority"],
  ["#Tech", "Launch"],
  ["#Brand", "UGC"],
] as const;

function tagPair(deal: Deal): [string, string] {
  let h = 0;
  for (let i = 0; i < deal.id.length; i++) h = (h + deal.id.charCodeAt(i)) % 997;
  const [a, b] = TAG_PRESETS[h % TAG_PRESETS.length]!;
  return [a, b];
}

function tagClass(label: string) {
  if (label === "Priority")
    return "border border-amber-200/80 bg-amber-50 text-[11px] font-semibold text-amber-900";
  if (label === "Story" || label === "Launch" || label === "Sponsored" || label === "UGC")
    return "bg-neutral-100 text-[11px] font-medium text-neutral-700";
  if (label.startsWith("#")) {
    if (label.includes("Luxury") || label.includes("Brand"))
      return "bg-violet-100 text-[11px] font-semibold text-violet-800";
    if (label.includes("Fitness") || label.includes("Tech"))
      return "bg-sky-100 text-[11px] font-semibold text-sky-800";
    return "bg-sky-100 text-[11px] font-semibold text-sky-800";
  }
  return "bg-neutral-100 text-[11px] font-medium text-neutral-700";
}

function dealDate(d: Deal) {
  const raw = d.close_date || d.created_at;
  return format(new Date(raw), "MMM d");
}

/** Two-letter mark for card corners (e.g. LS, NI) */
function brandMark(title: string) {
  const t = title.trim();
  if (t.length <= 2) return t.toUpperCase();
  const parts = t.split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

/** Footer avatar: sky circle like “D1” / initials */
function footerInitials(title: string) {
  const t = title.trim();
  if (/^deal\s*\d/i.test(t)) {
    const m = t.match(/\d+/);
    return m ? `D${m[0]}` : t.slice(0, 2).toUpperCase();
  }
  return brandMark(t);
}

type Props = {
  initial: Deal[];
  onAddDeal: (stage: DealStage) => void;
};

function reorderDeals(
  prev: Deal[],
  dealId: string,
  fromStage: DealStage,
  toStage: DealStage,
  destIndex: number,
): Deal[] {
  const moving = prev.find((x) => x.id === dealId);
  if (!moving) return prev;
  const rest = prev.filter((x) => x.id !== dealId);

  if (fromStage === toStage) {
    const inCol = rest
      .filter((x) => x.stage === fromStage)
      .sort((a, b) => a.position - b.position);
    inCol.splice(destIndex, 0, { ...moving, stage: fromStage });
    const re = inCol.map((x, i) => ({ ...x, position: i * 10, stage: fromStage as DealStage }));
    return rest.filter((x) => x.stage !== fromStage).concat(re);
  }

  const inFrom = rest
    .filter((x) => x.stage === fromStage)
    .sort((a, b) => a.position - b.position);
  const inTo = rest
    .filter((x) => x.stage === toStage)
    .sort((a, b) => a.position - b.position);
  inTo.splice(destIndex, 0, { ...moving, stage: toStage });
  const rFrom = inFrom.map((x, i) => ({ ...x, position: i * 10 }));
  const rTo = inTo.map((x, i) => ({ ...x, position: i * 10, stage: toStage as DealStage }));
  return rest
    .filter((x) => x.stage !== fromStage && x.stage !== toStage)
    .concat(rFrom, rTo);
}

function DragHandle(props: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label="Drag"
      className="mt-0.5 grid shrink-0 grid-cols-2 gap-0.5 self-start p-0.5 text-neutral-300 hover:text-neutral-400"
      {...props}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="size-1 rounded-full bg-current" />
      ))}
    </button>
  );
}

function DealCard({
  d,
  dragHandleProps,
  isDragging,
}: {
  d: Deal;
  dragHandleProps: DraggableProvidedDragHandleProps | null;
  isDragging: boolean;
}) {
  const [a, b] = tagPair(d);
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm transition",
        isDragging && "ring-2 ring-indigo-200/70 shadow-md",
      )}
    >
      <div className="flex items-start gap-2">
        {dragHandleProps ? <DragHandle {...dragHandleProps} /> : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 font-serif text-[15px] font-bold leading-tight text-neutral-950">
              {d.title}
            </h3>
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200/80 bg-gradient-to-br from-slate-50 to-slate-100 text-[10px] font-bold text-slate-600 shadow-sm"
              aria-hidden
            >
              {brandMark(d.title)}
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="font-serif text-lg font-bold tabular-nums tracking-tight text-blue-600">
              {formatMoney(d.value_cents, d.currency.toUpperCase())}
            </span>
            <span className="text-[13px] text-neutral-500">• {dealDate(d)}</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5",
                tagClass(a),
              )}
            >
              {a}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5",
                tagClass(b),
              )}
            >
              {b}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5">
        <div
          className="flex size-7 items-center justify-center rounded-full border border-sky-200/50 bg-sky-100 text-[10px] font-bold text-sky-800"
          aria-hidden
        >
          {footerInitials(d.title)}
        </div>
        <div className="flex items-center gap-1.5 text-neutral-400">
          <MessageCircle className="size-4 stroke-[1.5]" />
          <Paperclip className="size-4 stroke-[1.5]" />
          <History className="size-4 stroke-[1.5]" />
        </div>
      </div>
    </div>
  );
}

export function DealsKanban({ initial, onAddDeal }: Props) {
  const [deals, setDeals] = useState<Deal[]>(initial);
  useEffect(() => {
    setDeals(initial);
  }, [initial]);

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return;
      }
      const dealId = String(draggableId);
      const fromStage = source.droppableId as DealStage;
      const toStage = destination.droppableId as DealStage;
      const next = reorderDeals(deals, dealId, fromStage, toStage, destination.index);
      setDeals(next);

      const inFrom = next.filter((d) => d.stage === fromStage).sort((a, b) => a.position - b.position);
      const inTo = next.filter((d) => d.stage === toStage).sort((a, b) => a.position - b.position);
      const toPersist = new Map<string, { stage: DealStage; position: number }>();
      for (const d of inFrom) {
        toPersist.set(d.id, { stage: d.stage, position: d.position });
      }
      for (const d of inTo) {
        toPersist.set(d.id, { stage: d.stage, position: d.position });
      }
      try {
        for (const [id, patch] of toPersist) {
          await moveDeal({ id, stage: patch.stage, position: patch.position });
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save order");
        setDeals(initial);
      }
    },
    [deals, initial],
  );

  const byStage = useMemo(() => {
    const m: Record<DealStage, Deal[]> = {
      lead: [],
      qualified: [],
      proposal: [],
      negotiation: [],
      won: [],
      lost: [],
    };
    for (const d of deals) m[d.stage].push(d);
    (Object.keys(m) as DealStage[]).forEach((k) =>
      m[k].sort((a, b) => a.position - b.position),
    );
    return m;
  }, [deals]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2">
        {STAGES.map((col) => (
          <Column key={col.id} col={col} deals={byStage[col.id]} onAddDeal={onAddDeal} />
        ))}
      </div>
    </DragDropContext>
  );
}

function Column({
  col,
  deals,
  onAddDeal,
}: {
  col: (typeof STAGES)[number];
  deals: Deal[];
  onAddDeal: (stage: DealStage) => void;
}) {
  return (
    <div className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-200/80 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn("size-2 shrink-0 rounded-full", col.dot)}
            aria-hidden
          />
          <h2 className="font-serif text-[13px] font-bold uppercase tracking-wide text-neutral-950">
            {col.label}
          </h2>
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-100 px-1.5 text-[11px] font-semibold tabular-nums text-neutral-600">
            {deals.length}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "size-7 text-neutral-400 hover:text-neutral-700",
            )}
            aria-label="Column actions"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onAddDeal(col.id)} className="gap-2">
              <Plus className="size-3.5" />
              Add deal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Droppable droppableId={col.id} direction="vertical">
        {(prov, snap) => (
          <div
            ref={prov.innerRef}
            {...prov.droppableProps}
            className="max-h-[min(70dvh,780px)] min-h-40 flex-1 space-y-3 overflow-y-auto p-2.5"
          >
            {deals.map((d, i) => (
              <Draggable key={d.id} draggableId={d.id} index={i}>
                {(p, s) => (
                  <div
                    ref={p.innerRef}
                    {...p.draggableProps}
                    className="touch-manipulation"
                  >
                    <DealCard d={d} dragHandleProps={p.dragHandleProps} isDragging={s.isDragging} />
                  </div>
                )}
              </Draggable>
            ))}
            {prov.placeholder}
            {snap.isDraggingOver && !deals.length && (
              <p className="py-6 text-center text-xs text-neutral-400">Drop here</p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
