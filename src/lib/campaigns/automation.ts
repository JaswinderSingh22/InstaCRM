import { addDays, setHours, startOfDay } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrandReturningId, createLeadReturningId, createTask } from "@/app/actions/crm";
import { recordWorkspaceActivity } from "@/lib/activity/record-workspace-event";
import type { Campaign, CampaignStatus } from "@/types/database";

type SB = SupabaseClient;

function dateWithLocalMorning(isoDate: string | null, hour = 9): string | null {
  if (!isoDate?.trim()) return null;
  const d = startOfDay(new Date(`${isoDate.trim()}T00:00:00`));
  if (Number.isNaN(d.getTime())) return null;
  return setHours(d, hour).toISOString();
}

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
  await supabase.from("campaigns").update(patch).eq("id", id).eq("workspace_id", workspaceId);
}

/** Create a pipeline deal once per campaign (idempotent via linked_deal_id). */
async function ensureCampaignDeal(
  supabase: SB,
  workspaceId: string,
  c: Campaign,
  actorId: string,
): Promise<Campaign> {
  const cur = c;
  if (cur.linked_deal_id) return cur;

  const valueCents = cur.compensation_cents ?? 0;
  const title = `Campaign: ${cur.title.slice(0, 120)}`;
  const currency = (cur.currency || "INR").trim().toUpperCase();

  const { data: last } = await supabase
    .from("deals")
    .select("position")
    .eq("workspace_id", workspaceId)
    .eq("stage", "negotiation")
    .order("position", { ascending: false })
    .limit(1);
  const pos = ((last?.[0] as { position?: number } | undefined)?.position ?? -10) + 10;

  const { data: dealRow, error } = await supabase
    .from("deals")
    .insert({
      workspace_id: workspaceId,
      title,
      value_cents: valueCents,
      currency,
      stage: "negotiation",
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
    title: `Deal opened: ${title}`,
    summary: "Created from campaign pipeline",
    entityType: "deal",
    entityId: (dealRow as { id: string }).id,
  });

  const next = await refreshCampaign(supabase, workspaceId, cur.id);
  return next ?? cur;
}

/** Ensure brand + lead exist; updates campaign row. Returns refreshed campaign. */
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

async function handleApplied(supabase: SB, workspaceId: string, c: Campaign, _actorId: string) {
  let cur = await ensureCampaignBrandAndLead(supabase, workspaceId, c);
  cur = (await refreshCampaign(supabase, workspaceId, c.id)) ?? cur;
  if (cur.auto_task_applied_id) return;

  const due = addDays(setHours(startOfDay(new Date()), 9), 2).toISOString();
  const { task } = await createTask({
    title: `Follow up: ${cur.title.slice(0, 80)}`,
    description: `Application submitted — check for shortlist / next steps.\n\n${campaignRefBlock(cur)}`,
    dueAt: due,
    relatedType: cur.linked_lead_id ? "lead" : "none",
    relatedId: cur.linked_lead_id,
  });
  await patchCampaign(supabase, workspaceId, cur.id, { auto_task_applied_id: task.id });
}

async function handleInProgress(supabase: SB, workspaceId: string, c: Campaign, actorId: string) {
  let cur = await ensureCampaignBrandAndLead(supabase, workspaceId, c);
  cur = (await refreshCampaign(supabase, workspaceId, c.id)) ?? cur;
  cur = await ensureCampaignDeal(supabase, workspaceId, cur, actorId);

  if (cur.shoot_date && !cur.auto_task_shoot_id) {
    const due = dateWithLocalMorning(cur.shoot_date, 9);
    if (due) {
      const { task } = await createTask({
        title: `Shoot: ${cur.title.slice(0, 70)}`,
        description: `Campaign shoot day.\n\n${campaignRefBlock(cur)}`,
        dueAt: due,
        relatedType: cur.linked_lead_id ? "lead" : "none",
        relatedId: cur.linked_lead_id,
      });
      await patchCampaign(supabase, workspaceId, cur.id, { auto_task_shoot_id: task.id });
      cur = (await refreshCampaign(supabase, workspaceId, cur.id)) ?? cur;
    }
  }

  const postDay = cur.post_date_end || cur.post_date;
  if (postDay && !cur.auto_task_post_id) {
    const due = dateWithLocalMorning(postDay, 17);
    if (due) {
      const { task } = await createTask({
        title: `Post deadline: ${cur.title.slice(0, 60)}`,
        description: `Publish deliverables (see campaign brief).\n\n${campaignRefBlock(cur)}`,
        dueAt: due,
        relatedType: cur.linked_lead_id ? "lead" : "none",
        relatedId: cur.linked_lead_id,
      });
      await patchCampaign(supabase, workspaceId, cur.id, { auto_task_post_id: task.id });
    }
  }
}

async function handleCompleted(supabase: SB, workspaceId: string, c: Campaign, actorId: string) {
  let cur = (await refreshCampaign(supabase, workspaceId, c.id)) ?? c;

  if (!cur.linked_lead_id) {
    cur = await ensureCampaignBrandAndLead(supabase, workspaceId, cur);
    cur = (await refreshCampaign(supabase, workspaceId, cur.id)) ?? cur;
  }

  cur = await ensureCampaignDeal(supabase, workspaceId, cur, actorId);
  cur = (await refreshCampaign(supabase, workspaceId, cur.id)) ?? cur;

  if (cur.linked_deal_id) {
    const { error: dealErr } = await supabase
      .from("deals")
      .update({ stage: "won" })
      .eq("id", cur.linked_deal_id)
      .eq("workspace_id", workspaceId);
    if (!dealErr) {
      await recordWorkspaceActivity(supabase, {
        workspaceId,
        actorId,
        eventType: "deal_stage_changed",
        title: `Deal won: ${cur.title.slice(0, 80)}`,
        summary: "Campaign marked done",
        entityType: "deal",
        entityId: cur.linked_deal_id,
      });
    }
  }

  if (cur.auto_task_completed_id) return;

  const due = addDays(setHours(startOfDay(new Date()), 10), 5).toISOString();
  const { task } = await createTask({
    title: `Wrap up: ${cur.title.slice(0, 70)}`,
    description: `Confirm payment / deliverables closed and archive references.\n\n${campaignRefBlock(cur)}`,
    dueAt: due,
    relatedType: cur.linked_lead_id ? "lead" : "none",
    relatedId: cur.linked_lead_id,
  });
  await patchCampaign(supabase, workspaceId, cur.id, { auto_task_completed_id: task.id });
}

/**
 * Run side-effects when campaign status changes (idempotent per stored task ids).
 */
export async function runCampaignStatusAutomation(
  supabase: SB,
  workspaceId: string,
  beforeStatus: CampaignStatus,
  campaign: Campaign,
  actorId: string,
) {
  if (beforeStatus === campaign.status) return;

  switch (campaign.status) {
    case "applied":
      await handleApplied(supabase, workspaceId, campaign, actorId);
      break;
    case "in_progress":
      await handleInProgress(supabase, workspaceId, campaign, actorId);
      break;
    case "completed":
      await handleCompleted(supabase, workspaceId, campaign, actorId);
      break;
    default:
      break;
  }
}
