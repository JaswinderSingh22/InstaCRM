"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DragDropContext,
  type DropResult,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Deal, DealStage } from "@/types/database";
import { moveDeal } from "@/app/actions/crm";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STAGES: { id: DealStage; label: string; dot: string }[] = [
  { id: "lead", label: "New inquiry", dot: "bg-blue-500" },
  { id: "qualified", label: "Qualified", dot: "bg-slate-500" },
  { id: "proposal", label: "Proposal sent", dot: "bg-violet-500" },
  { id: "negotiation", label: "Negotiating", dot: "bg-amber-500" },
  { id: "won", label: "Won", dot: "bg-emerald-500" },
  { id: "lost", label: "Lost", dot: "bg-rose-500" },
];

type Props = {
  initial: Deal[];
  onAddDeal: (stage: DealStage) => void;
  onEditDeal: (d: Deal) => void;
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

function dealMetaLine(d: Deal) {
  if (d.close_date) {
    return `Target close ${format(new Date(d.close_date), "MMM d, yyyy")}`;
  }
  return `Added ${format(new Date(d.created_at), "MMM d, yyyy")}`;
}

function DealCard({
  d,
  isDragging,
  onEdit,
}: {
  d: Deal;
  isDragging: boolean;
  onEdit: () => void;
}) {
  return (
    <div
      className={cn(
        "relative group rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm transition",
        isDragging && "border-indigo-300 shadow-lg ring-2 ring-indigo-200/60",
      )}
    >
      <h3 className="line-clamp-2 font-semibold text-[15px] leading-snug text-neutral-950">{d.title}</h3>
      <p className="mt-2 font-semibold tabular-nums tracking-tight text-[#4F46E5]">
        {formatMoney(d.value_cents, d.currency.toUpperCase())}
      </p>
      <p className="mt-1 text-xs text-neutral-500">{dealMetaLine(d)}</p>
      <div className="pointer-events-none absolute top-2 right-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 [&_button]:pointer-events-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex size-7 items-center justify-center rounded-md border border-neutral-200/80 bg-white/95 text-neutral-700 shadow-sm outline-none hover:bg-neutral-50"
            aria-label="Deal actions"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              className="gap-2"
              onClick={(e) => {
                e.preventDefault();
                onEdit();
              }}
            >
              <Pencil className="size-3.5" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function DealsKanban({ initial, onAddDeal, onEditDeal }: Props) {
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

      const snapshot = deals;
      const dealId = String(draggableId);
      const fromStage = source.droppableId as DealStage;
      const toStage = destination.droppableId as DealStage;
      const next = reorderDeals(snapshot, dealId, fromStage, toStage, destination.index);
      setDeals(next);

      const inFrom = next.filter((d) => d.stage === fromStage).sort((a, b) => a.position - b.position);
      const inTo = next.filter((d) => d.stage === toStage).sort((a, b) => a.position - b.position);
      const touched = new Map<string, Deal>();
      for (const d of inFrom) touched.set(d.id, d);
      for (const d of inTo) touched.set(d.id, d);
      const updates = [...touched.values()].filter((d) => {
        const o = snapshot.find((p) => p.id === d.id);
        return !o || o.stage !== d.stage || o.position !== d.position;
      });

      try {
        await Promise.all(
          updates.map((d) => moveDeal({ id: d.id, stage: d.stage, position: d.position })),
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save order");
        setDeals(snapshot);
      }
    },
    [deals],
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
      <div className="-mx-1 flex touch-pan-x flex-wrap content-start gap-3 px-1 pb-4 pt-1 sm:gap-4 md:mx-0 md:flex-nowrap md:gap-4 md:overflow-x-auto md:overflow-y-visible md:px-0 md:pb-6 md:[-ms-overflow-style:none] md:[scrollbar-width:thin] md:[&::-webkit-scrollbar]:h-2">
        {STAGES.map((col) => (
          <Column key={col.id} col={col} deals={byStage[col.id]} onAddDeal={onAddDeal} onEditDeal={onEditDeal} />
        ))}
      </div>
    </DragDropContext>
  );
}

function Column({
  col,
  deals,
  onAddDeal,
  onEditDeal,
}: {
  col: (typeof STAGES)[number];
  deals: Deal[];
  onAddDeal: (stage: DealStage) => void;
  onEditDeal: (d: Deal) => void;
}) {
  return (
    <div className="flex w-[min(280px,calc(100vw-2.5rem))] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm sm:w-[min(300px,85vw)]">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200/80 px-2.5 py-2 sm:px-3 sm:py-2.5">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <span className={cn("size-2 shrink-0 rounded-full", col.dot)} aria-hidden />
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-neutral-950 sm:text-[13px]">
            {col.label}
          </h2>
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-100 px-1.5 text-[11px] font-semibold tabular-nums text-neutral-600">
            {deals.length}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-neutral-500 hover:bg-neutral-100 hover:text-[#4F46E5]"
          aria-label={`Add deal to ${col.label}`}
          onClick={() => onAddDeal(col.id)}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <Droppable droppableId={col.id} direction="vertical">
        {(prov, snap) => (
          <div
            ref={prov.innerRef}
            {...prov.droppableProps}
            className="min-h-[11rem] flex-1 space-y-2.5 p-2 sm:min-h-40 sm:space-y-3 sm:p-2.5"
          >
            {deals.map((d, i) => (
              <Draggable key={d.id} draggableId={d.id} index={i}>
                {(p, s) => (
                  <div
                    ref={p.innerRef}
                    {...p.draggableProps}
                    className="relative touch-manipulation active:cursor-grabbing"
                  >
                    <div {...p.dragHandleProps}>
                      <DealCard
                        d={d}
                        isDragging={s.isDragging}
                        onEdit={() => onEditDeal(d)}
                      />
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {prov.placeholder}
            {snap.isDraggingOver && !deals.length ? (
              <p className="py-6 text-center text-xs text-neutral-400">Drop here</p>
            ) : null}
          </div>
        )}
      </Droppable>
    </div>
  );
}
