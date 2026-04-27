"use server";

import { recordWorkspaceActivity } from "@/lib/activity/record-workspace-event";
import { revalidatePath } from "next/cache";
import { getWorkspaceContextOrThrow } from "@/lib/crm/server-workspace";
import { parseCampaignBriefWithOpenAI } from "@/lib/openai/parse-campaign-brief";
import { runCampaignStatusAutomation } from "@/lib/campaigns/automation";
import { normalizeWorkspaceCurrency } from "@/lib/currency";
import { fetchWorkspaceDefaultCurrency } from "@/lib/workspace-currency";
import type { Campaign, CampaignCompensationType, CampaignStatus } from "@/types/database";

async function workspace() {
  const c = await getWorkspaceContextOrThrow();
  return { supabase: c.supabase, workspaceId: c.workspaceId, userId: c.userId };
}

function rev() {
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  revalidatePath("/deals");
  revalidatePath("/payments");
  revalidatePath("/leads");
  revalidatePath("/brands");
  revalidatePath("/calendar");
  revalidatePath("/tasks");
}

export async function parseBriefWithAi(rawText: string) {
  return parseCampaignBriefWithOpenAI(rawText);
}

export async function createCampaign(input: {
  title: string;
  status?: CampaignStatus;
  brand_name?: string | null;
  agency_name?: string | null;
  compensation_summary?: string | null;
  compensation_cents?: number | null;
  compensation_type?: CampaignCompensationType;
  deliverables?: string[];
  shoot_date?: string | null;
  post_date?: string | null;
  post_date_end?: string | null;
  apply_url?: string | null;
  location_notes?: string | null;
  requirements_notes?: string | null;
  source_message?: string | null;
  currency?: string;
}) {
  const { supabase, workspaceId, userId } = await workspace();
  const defaultCur = await fetchWorkspaceDefaultCurrency(supabase, workspaceId);
  const status = input.status ?? "inbox";
  const { data: last } = await supabase
    .from("campaigns")
    .select("position")
    .eq("workspace_id", workspaceId)
    .eq("status", status)
    .order("position", { ascending: false })
    .limit(1);

  const position = (last?.[0]?.position ?? -10) + 10;

  const { data: created, error } = await supabase
    .from("campaigns")
    .insert({
      workspace_id: workspaceId,
      title: input.title.trim(),
      status,
      position,
      brand_name: input.brand_name?.trim() || null,
      agency_name: input.agency_name?.trim() || null,
      compensation_summary: input.compensation_summary?.trim() || null,
      compensation_cents: input.compensation_cents ?? null,
      compensation_type: input.compensation_type ?? "unknown",
      deliverables: input.deliverables ?? [],
      shoot_date: input.shoot_date || null,
      post_date: input.post_date || null,
      post_date_end: input.post_date_end || null,
      apply_url: input.apply_url?.trim() || null,
      location_notes: input.location_notes?.trim() || null,
      requirements_notes: input.requirements_notes?.trim() || null,
      source_message: input.source_message?.trim() || null,
      currency: input.currency?.trim()
        ? normalizeWorkspaceCurrency(input.currency)
        : defaultCur,
    })
    .select("id")
    .single();

  if (error) throw error;
  await recordWorkspaceActivity(supabase, {
    workspaceId,
    actorId: userId,
    eventType: "campaign_created",
    title: `Campaign: ${input.title.trim()}`,
    entityType: "campaign",
    entityId: (created as { id: string }).id,
  });
  rev();
}

export async function updateCampaign(
  id: string,
  patch: Partial<{
    title: string;
    status: CampaignStatus;
    position: number;
    brand_name: string | null;
    agency_name: string | null;
    compensation_summary: string | null;
    compensation_cents: number | null;
    compensation_type: CampaignCompensationType;
    deliverables: string[];
    shoot_date: string | null;
    post_date: string | null;
    post_date_end: string | null;
    apply_url: string | null;
    location_notes: string | null;
    requirements_notes: string | null;
    source_message: string | null;
    currency: string;
  }>,
) {
  const { supabase, workspaceId, userId } = await workspace();
  const { data: beforeRow, error: loadErr } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (loadErr) throw loadErr;
  if (!beforeRow) throw new Error("Campaign not found");
  const previousStatus = (beforeRow as Campaign).status;

  const { error } = await supabase
    .from("campaigns")
    .update(patch)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;

  if (patch.status !== undefined && patch.status !== previousStatus) {
    await recordWorkspaceActivity(supabase, {
      workspaceId,
      actorId: userId,
      eventType: "campaign_status_changed",
      title: `Campaign → ${patch.status.replace(/_/g, " ")}`,
      summary: `${(beforeRow as Campaign).title}: ${previousStatus} → ${patch.status}`,
      entityType: "campaign",
      entityId: id,
    });
    const { data: afterRow } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (afterRow) {
      await runCampaignStatusAutomation(supabase, workspaceId, previousStatus, afterRow as Campaign, userId);
    }
  }
  rev();
}

export async function moveCampaign(input: {
  id: string;
  status: CampaignStatus;
  position: number;
}) {
  await updateCampaign(input.id, { status: input.status, position: input.position });
}

export async function deleteCampaign(id: string) {
  const { supabase, workspaceId } = await workspace();

  const { data: row, error: loadErr } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (loadErr) throw loadErr;
  if (!row) throw new Error("Campaign not found");

  const c = row as Campaign;

  const taskIds = [
    c.auto_task_applied_id,
    c.auto_task_shoot_id,
    c.auto_task_post_id,
    c.auto_task_completed_id,
  ].filter((x): x is string => typeof x === "string" && x.length > 0);

  if (taskIds.length > 0) {
    const { error: taskErr } = await supabase
      .from("tasks")
      .delete()
      .in("id", taskIds)
      .eq("workspace_id", workspaceId);
    if (taskErr) throw taskErr;
  }

  if (c.linked_deal_id) {
    const { error: payErr } = await supabase
      .from("payments")
      .delete()
      .eq("deal_id", c.linked_deal_id)
      .eq("workspace_id", workspaceId);
    if (payErr) throw payErr;
    const { error: dealErr } = await supabase
      .from("deals")
      .delete()
      .eq("id", c.linked_deal_id)
      .eq("workspace_id", workspaceId);
    if (dealErr) throw dealErr;
  }

  if (c.linked_lead_id) {
    const { data: leadRow } = await supabase
      .from("leads")
      .select("source, notes")
      .eq("id", c.linked_lead_id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    const lr = leadRow as { source?: string | null; notes?: string | null } | null;
    if (
      lr?.source === "Campaign" &&
      typeof lr.notes === "string" &&
      lr.notes.includes(`Campaign ID: ${id}`)
    ) {
      const { error: leadErr } = await supabase
        .from("leads")
        .delete()
        .eq("id", c.linked_lead_id)
        .eq("workspace_id", workspaceId);
      if (leadErr) throw leadErr;
    }
  }

  if (c.linked_brand_id) {
    const { count: otherCampaigns } = await supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("linked_brand_id", c.linked_brand_id)
      .neq("id", id);

    let otherDealsQuery = supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("brand_id", c.linked_brand_id);
    if (c.linked_deal_id) {
      otherDealsQuery = otherDealsQuery.neq("id", c.linked_deal_id);
    }
    const { count: otherDeals } = await otherDealsQuery;

    if ((otherCampaigns ?? 0) === 0 && (otherDeals ?? 0) === 0) {
      const bid = c.linked_brand_id;
      const { error: evErr } = await supabase
        .from("relationship_events")
        .delete()
        .eq("brand_id", bid)
        .eq("workspace_id", workspaceId);
      if (evErr) throw evErr;
      const { error: pcErr } = await supabase
        .from("partner_contacts")
        .delete()
        .eq("brand_id", bid)
        .eq("workspace_id", workspaceId);
      if (pcErr) throw pcErr;
      const { error: brErr } = await supabase
        .from("brands")
        .delete()
        .eq("id", bid)
        .eq("workspace_id", workspaceId);
      if (brErr) throw brErr;
    }
  }

  const { error } = await supabase.from("campaigns").delete().eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw error;
  rev();
}
