"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DragDropContext,
  type DropResult,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Deal, DealStage } from "@/types/database";
import { createDeal, moveDeal } from "@/app/actions/crm";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";
import { GripVertical, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

const STAGES: { id: DealStage; label: string; tone: string }[] = [
  { id: "lead", label: "New", tone: "bg-zinc-500/20 text-zinc-200" },
  { id: "qualified", label: "Qualified", tone: "bg-blue-500/15 text-blue-200" },
  { id: "proposal", label: "Proposal", tone: "bg-amber-500/15 text-amber-200" },
  { id: "negotiation", label: "Negotiation", tone: "bg-violet-500/15 text-violet-200" },
  { id: "won", label: "Won", tone: "bg-emerald-500/15 text-emerald-200" },
  { id: "lost", label: "Lost", tone: "bg-rose-500/15 text-rose-200" },
];

type Props = { initial: Deal[] };

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

export function DealsKanban({ initial }: Props) {
  const [deals, setDeals] = useState<Deal[]>(initial);
  const router = useRouter();

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
      <div className="grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4 sm:gap-4">
        {STAGES.map((col) => (
          <Column
            key={col.id}
            col={col}
            deals={byStage[col.id]}
            onAdd={() => router.refresh()}
          />
        ))}
      </div>
    </DragDropContext>
  );
}

function Column({
  col,
  deals,
  onAdd,
}: {
  col: (typeof STAGES)[number];
  deals: Deal[];
  onAdd: () => void;
}) {
  return (
    <div className="flex min-h-[420px] w-[280px] flex-shrink-0 flex-col rounded-lg border border-border/60 bg-card/30 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border/40 px-2 py-1.5">
        <div className="flex items-center gap-2">
          <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", col.tone)}>
            {col.label}
          </span>
          <span className="text-xs text-muted-foreground">{deals.length}</span>
        </div>
        <AddDealButton stage={col.id} onCreated={onAdd} />
      </div>
      <Droppable droppableId={col.id} direction="vertical">
        {(prov, snap) => (
          <div
            ref={prov.innerRef}
            {...prov.droppableProps}
            className="max-h-[min(70dvh,720px)] min-h-32 flex-1 space-y-1.5 overflow-y-auto p-1.5"
          >
            <AnimatePresence initial={false}>
              {deals.map((d, i) => (
                <Draggable key={d.id} draggableId={d.id} index={i}>
                  {(p, s) => (
                    <div
                      ref={p.innerRef}
                      {...p.draggableProps}
                      className="touch-manipulation"
                    >
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-md border border-border/50 bg-background/80 shadow-sm"
                        style={s.isDragging ? { opacity: 0.75 } : undefined}
                      >
                        <Card className="border-0 shadow-none">
                          <CardHeader className="space-y-0 p-2 pb-1">
                            <div className="flex items-start gap-1">
                              <button
                                type="button"
                                className="mt-0.5 text-muted-foreground hover:text-foreground"
                                aria-label="Drag"
                                {...p.dragHandleProps}
                              >
                                <GripVertical className="size-3.5" />
                              </button>
                              <p className="line-clamp-2 flex-1 text-left text-sm font-medium leading-tight">
                                {d.title}
                              </p>
                            </div>
                          </CardHeader>
                          <CardContent className="p-2 pt-0 text-xs text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span>
                                {formatMoney(d.value_cents, d.currency.toUpperCase())}
                              </span>
                              <Badge variant="secondary" className="text-[10px] font-normal">
                                {d.currency.toUpperCase()}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>
                  )}
                </Draggable>
              ))}
            </AnimatePresence>
            {prov.placeholder}
            {snap.isDraggingOver && !deals.length && (
              <p className="p-3 text-center text-xs text-muted-foreground">Drop here</p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function AddDealButton({ stage, onCreated }: { stage: DealStage; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [cents, setCents] = useState("10000");
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Add deal"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>New deal in {stage}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const v = Math.max(0, Math.floor(Number(cents) || 0));
            await createDeal({ title, valueCents: v, stage });
            setOpen(false);
            setTitle("");
            onCreated();
            toast.success("Deal created");
          }}
        >
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Value (cents)</Label>
            <Input
              type="number"
              value={cents}
              onChange={(e) => setCents(e.target.value)}
              min={0}
            />
          </div>
          <Button type="submit" className="w-full">
            Create
          </Button>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
