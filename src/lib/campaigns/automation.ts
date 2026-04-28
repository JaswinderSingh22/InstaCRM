import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, parseISO } from "date-fns";
import { createBrandReturningId, createLeadReturningId } from "@/app/actions/crm";
import { recordWorkspaceActivity } from "@/lib/activity/record-workspace-event";
import { normalizeWorkspaceCurrency } from "@/lib/currency";
import type { Campaign, TaskRelated } from "@/types/database";

type SB = SupabaseClient;

/** Open pipeline stages used for default deal ordering. */
const OPEN_DEAL_STAGES = ["lead", "qualified", "proposal", "negotiation"] as const;

function campaignRefBlock(c: Campaign): string {
  const budgetLine =
    c.compensation_cents != null && c.compensation_cents > 0
      ? `Estimated budget: ${(c.compensation_cents / 100).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`
      : null;
  const lines = [
    budgetLine,
    `Campaign ID: ${c.id}`,
    c.apply_url ? `Apply: ${c.apply_url}` : null,
    c.compensation_summary ? `Compensation: ${c.compensation_summary}` : null,
    c.agency_name ? `Agency: ${c.agency_name}` : null,
    c.location_notes ? `Location/audience: ${c.location_notes}` : null,
    c.requirements_notes ? `Notes: ${c.requirements_notes}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

async function findBrandIdByName(workspaceId: string, supabase: SB, name: string): Promise<string | null> {
  const n = name.trim();
  if (!n) return null;
  const { data } = await supabase
    .from("brands")
    .select("id, name")
    .eq("workspace_id", workspaceId);
  const rows = (data ?? []) as { id: string; name: string }[];
  const lower = n.toLowerCase();
  const hit = rows.find((r) => r.name.trim().toLowerCase() === lower);
  return hit?.id ?? null;
}

async function refreshCampaign(supabase: SB, workspaceId: string, id: string): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .single();
  if (error || !data) return null;
  return data as Campaign;
}

async function patchCampaign(supabase: SB, workspaceId: string, id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from("campaigns").update(patch).eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw error;
}

function dealTitleForCampaign(c: Campaign): string {
  return `Campaign: ${c.title.slice(0, 120)}`;
}

/** Create one pipeline deal per campaign (idempotent). Call only from bootstrap after create. */
async function ensureCampaignDeal(
  supabase: SB,
  workspaceId: string,
  c: Campaign,
  actorId: string,
): Promise<Campaign> {
  const fresh = await refreshCampaign(supabase, workspaceId, c.id);
  const cur = fresh ?? c;
  if (cur.linked_deal_id) return cur;

  const dealTitle = dealTitleForCampaign(cur);

  const orphanId = await findOrphanDealByTitle(supabase, workspaceId, dealTitle);
  if (orphanId) {
    await patchCampaign(supabase, workspaceId, cur.id, { linked_deal_id: orphanId });
    return (await refreshCampaign(supabase, workspaceId, cur.id)) ?? cur;
  }

  const valueCents = cur.compensation_cents ?? 0;
  const currency = (cur.currency || "INR").trim().toUpperCase();

  const { data: last } = await supabase
    .from("deals")
    .select("position")
    .eq("workspace_id", workspaceId)
    .in("stage", [...OPEN_DEAL_STAGES])
    .order("position", { ascending: false })
    .limit(1);
  const pos = ((last?.[0] as { position?: number } | undefined)?.position ?? -10) + 10;

  const { data: dealRow, error } = await supabase
    .from("deals")
    .insert({
      workspace_id: workspaceId,
      title: dealTitle,
      value_cents: valueCents,
      currency,
      stage: "proposal",
      position: pos,
      brand_id: cur.linked_brand_id ?? null,
      lead_id: cur.linked_lead_id ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;

  await patchCampaign(supabase, workspaceId, cur.id, { linked_deal_id: (dealRow as { id: string }).id });

  await recordWorkspaceActivity(supabase, {
    workspaceId,
    actorId,
    eventType: "deal_created",
    title: `Deal opened: ${dealTitle}`,
    summary: "Created with campaign",
    entityType: "deal",
    entityId: (dealRow as { id: string }).id,
  });

  const next = await refreshCampaign(supabase, workspaceId, cur.id);
  return next ?? cur;
}

/** Deal with this title not referenced by any campaign’s linked_deal_id (safe to attach). */
async function findOrphanDealByTitle(
  supabase: SB,
  workspaceId: string,
  title: string,
): Promise<string | null> {
  const { data: deals } = await supabase
    .from("deals")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("title", title)
    .order("created_at", { ascending: true });

  const rows = (deals ?? []) as { id: string }[];
  if (rows.length === 0) return null;

  const { data: refs } = await supabase
    .from("campaigns")
    .select("linked_deal_id")
    .eq("workspace_id", workspaceId)
    .not("linked_deal_id", "is", null);

  const linked = new Set(
    ((refs ?? []) as { linked_deal_id: string | null }[])
      .map((r) => r.linked_deal_id)
      .filter(Boolean) as string[],
  );

  const orphan = rows.find((r) => !linked.has(r.id));
  return orphan?.id ?? null;
}

function ymdToUtcIso(ymd: string | null, hourUtc: number): string | null {
  if (!ymd) return null;
  const parts = ymd.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y == null || m == null || d == null) return null;
  return new Date(Date.UTC(y, m - 1, d, hourUtc, 0, 0)).toISOString();
}

type TaskSlot = "applied" | "shoot" | "post" | "completed";

const TASK_FIELD: Record<
  TaskSlot,
  "auto_task_applied_id" | "auto_task_shoot_id" | "auto_task_post_id" | "auto_task_completed_id"
> = {
  applied: "auto_task_applied_id",
  shoot: "auto_task_shoot_id",
  post: "auto_task_post_id",
  completed: "auto_task_completed_id",
} as const;

function taskTitleForSlot(c: Campaign, slot: TaskSlot): string {
  const t = c.title.slice(0, 100);
  switch (slot) {
    case "applied":
      return `Apply / follow up: ${t}`;
    case "shoot":
      return `Shoot day: ${t}`;
    case "post":
      return `Post content: ${t}`;
    case "completed":
      return `Wrap & payment: ${t}`;
  }
}

function taskDescription(c: Campaign): string {
  return `From campaign board. Campaign ID: ${c.id}`;
}

function dueForSlot(c: Campaign, slot: TaskSlot): string | null {
  const created = parseISO(c.created_at);
  switch (slot) {
    case "applied":
      return addDays(created, 3).toISOString();
    case "shoot":
      return ymdToUtcIso(c.shoot_date, 9);
    case "post":
      return ymdToUtcIso(c.post_date, 9);
    case "completed": {
      const end = c.post_date_end || c.post_date;
      return ymdToUtcIso(end, 12);
    }
  }
}

async function upsertOneCalendarTask(
  supabase: SB,
  workspaceId: string,
  c: Campaign,
  slot: TaskSlot,
  related: { type: TaskRelated; id: string },
): Promise<string | null> {
  const dueAt = dueForSlot(c, slot);
  const field = TASK_FIELD[slot];
  const existingId = (c[field] as string | null) ?? null;

  if (!dueAt) {
    if (existingId) {
      await supabase.from("tasks").delete().eq("id", existingId).eq("workspace_id", workspaceId);
      await patchCampaign(supabase, workspaceId, c.id, { [field]: null });
    }
    return null;
  }

  const title = taskTitleForSlot(c, slot);
  const desc = taskDescription(c);

  if (existingId) {
    const { error } = await supabase
      .from("tasks")
      .update({
        title,
        description: desc,
        due_at: dueAt,
        reminder_at: null,
        related_type: related.type,
        related_id: related.id,
      })
      .eq("id", existingId)
      .eq("workspace_id", workspaceId);
    if (error) throw error;
    return existingId;
  }

  const { data: row, error } = await supabase
    .from("tasks")
    .insert({
      workspace_id: workspaceId,
      title,
      description: desc,
      due_at: dueAt,
      reminder_at: null,
      completed: false,
      related_type: related.type,
      related_id: related.id,
    })
    .select("id")
    .single();
  if (error) throw error;
  const newId = (row as { id: string }).id;
  await patchCampaign(supabase, workspaceId, c.id, { [field]: newId });
  return newId;
}

/**
 * Create/update calendar tasks tied to the campaign deal. Runs after deal exists.
 */
export async function syncCampaignCalendarTasks(
  supabase: SB,
  workspaceId: string,
  c: Campaign,
): Promise<void> {
  const dealId = c.linked_deal_id;
  if (!dealId) return;

  const related = { type: "deal" as const, id: dealId };
  const slots: TaskSlot[] = ["applied", "shoot", "post", "completed"];
  for (const slot of slots) {
    await upsertOneCalendarTask(supabase, workspaceId, c, slot, related);
  }
}

async function ensureCampaignPayment(
  supabase: SB,
  workspaceId: string,
  c: Campaign,
  actorId: string,
): Promise<void> {
  if (!c.linked_deal_id) return;

  const clientName = (c.brand_name?.trim() || c.title.trim()).slice(0, 200);
  const description = `Campaign: ${c.title.slice(0, 180)}`;
  const amountCents = Math.max(0, c.compensation_cents ?? 0);
  const currency = normalizeWorkspaceCurrency((c.currency || "INR").trim());
  const dueDate = c.post_date_end || c.post_date || null;

  const { data: existing } = await supabase
    .from("payments")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("deal_id", c.linked_deal_id)
    .maybeSingle();

  if (!existing) {
    const { data: inserted, error } = await supabase
      .from("payments")
      .insert({
        workspace_id: workspaceId,
        deal_id: c.linked_deal_id,
        campaign_id: c.id,
        client_name: clientName,
        amount_cents: amountCents,
        currency,
        status: "pending",
        due_date: dueDate,
        description,
      })
      .select("id")
      .single();
    if (error) throw error;
    await recordWorkspaceActivity(supabase, {
      workspaceId,
      actorId,
      eventType: "payment_created",
      title: `Invoice: ${clientName}`,
      summary: description,
      entityType: "payment",
      entityId: (inserted as { id: string }).id,
    });
    return;
  }

  const pay = existing as { id: string; status: string };
  if (pay.status === "paid" || pay.status === "canceled") return;

  const { error: upErr } = await supabase
    .from("payments")
    .update({
      client_name: clientName,
      amount_cents: amountCents,
      currency,
      due_date: dueDate,
      description,
      campaign_id: c.id,
    })
    .eq("id", pay.id)
    .eq("workspace_id", workspaceId);
  if (upErr) throw upErr;
}

/** Refresh tasks + pending invoice from latest campaign fields (safe to call often). */
export async function syncCampaignDerivedRecords(
  supabase: SB,
  workspaceId: string,
  campaignId: string,
  _actorId: string,
): Promise<void> {
  const cur = await refreshCampaign(supabase, workspaceId, campaignId);
  if (!cur?.linked_deal_id) return;
  await syncCampaignCalendarTasks(supabase, workspaceId, cur);
  await ensureCampaignPayment(supabase, workspaceId, cur, _actorId);
}

/** Ensure brand + lead exist; updates campaign row. */
export async function ensureCampaignBrandAndLead(supabase: SB, workspaceId: string, c: Campaign): Promise<Campaign> {
  let cur = c;
  let brandId = cur.linked_brand_id;

  if (!brandId && cur.brand_name?.trim()) {
    const existing = await findBrandIdByName(workspaceId, supabase, cur.brand_name);
    if (existing) {
      brandId = existing;
      await patchCampaign(supabase, workspaceId, cur.id, { linked_brand_id: brandId });
    } else {
      brandId = await createBrandReturningId({
        name: cur.brand_name.trim(),
        industry: cur.agency_name ? `Agency: ${cur.agency_name}` : undefined,
      });
      await patchCampaign(supabase, workspaceId, cur.id, { linked_brand_id: brandId });
    }
    const next = await refreshCampaign(supabase, workspaceId, cur.id);
    if (next) cur = next;
  }

  if (!cur.linked_lead_id) {
    const company = cur.brand_name?.trim() || cur.title.trim().slice(0, 120);
    const contactName = cur.brand_name?.trim()
      ? cur.agency_name
        ? `${cur.brand_name.trim()} (via ${cur.agency_name})`
        : `${cur.brand_name.trim()} — contact`
      : cur.title.trim().slice(0, 120);
    const leadId = await createLeadReturningId({
      name: contactName,
      company,
      source: "Campaign",
      status: "new",
      notes: campaignRefBlock(cur),
    });
    await patchCampaign(supabase, workspaceId, cur.id, { linked_lead_id: leadId });
    const next = await refreshCampaign(supabase, workspaceId, cur.id);
    if (next) cur = next;
  }

  return cur;
}

/**
 * After creating a campaign row: create linked brand (if name), lead, and one deal.
 * Idempotent if called again (uses linked_* / deal title).
 */
export async function bootstrapCampaignPipeline(
  supabase: SB,
  workspaceId: string,
  campaignId: string,
  actorId: string,
): Promise<void> {
  let cur = await refreshCampaign(supabase, workspaceId, campaignId);
  if (!cur) return;

  cur = await ensureCampaignBrandAndLead(supabase, workspaceId, cur);
  cur = (await refreshCampaign(supabase, workspaceId, campaignId)) ?? cur;
  await ensureCampaignDeal(supabase, workspaceId, cur, actorId);
  await syncCampaignDerivedRecords(supabase, workspaceId, campaignId, actorId);
}

/** Kept for backward compatibility; campaign pipeline no longer reacts to column moves. */
export async function runCampaignStatusAutomation(
  _supabase: SB,
  _workspaceId: string,
  _beforeStatus: Campaign["status"],
  _campaign: Campaign,
  _actorId: string,
) {
  /* Manual-only: bootstrapping runs on createCampaign only. */
}
