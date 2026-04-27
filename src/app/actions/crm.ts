"use server";

import { recordWorkspaceActivity } from "@/lib/activity/record-workspace-event";
import { getWorkspaceContextOrThrow } from "@/lib/crm/server-workspace";
import { normalizeWorkspaceCurrency } from "@/lib/currency";
import { fetchWorkspaceDefaultCurrency } from "@/lib/workspace-currency";
import { revalidatePath } from "next/cache";
import type {
  BrandActivityKind,
  BrandContactStatus,
  LeadStatus,
  DealStage,
  PaymentStatus,
  Task,
  TaskRelated,
  TemplateType,
} from "@/types/database";

async function getWorkspace() {
  const c = await getWorkspaceContextOrThrow();
  return { supabase: c.supabase, workspaceId: c.workspaceId, userId: c.userId };
}

function rev() {
  revalidatePath("/dashboard");
  revalidatePath("/campaigns");
  revalidatePath("/leads");
  revalidatePath("/leads/archived");
  revalidatePath("/deals");
  revalidatePath("/brands");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/payments");
  revalidatePath("/templates");
  revalidatePath("/settings");
}

export async function updateWorkspaceDefaultCurrency(currency: string) {
  const { supabase, workspaceId } = await getWorkspace();
  const code = normalizeWorkspaceCurrency(currency);
  const { error } = await supabase
    .from("workspaces")
    .update({ default_currency: code })
    .eq("id", workspaceId);
  if (error) throw error;
  rev();
}

export async function createLead(input: {
  name: string;
  email?: string;
  company?: string;
  source?: string;
  status?: LeadStatus;
  notes?: string | null;
}) {
  const { supabase, workspaceId, userId } = await getWorkspace();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      workspace_id: workspaceId,
      name: input.name,
      email: input.email ?? null,
      company: input.company ?? null,
      source: input.source ?? null,
      status: input.status ?? "new",
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  await recordWorkspaceActivity(supabase, {
    workspaceId,
    actorId: userId,
    eventType: "lead_created",
    title: `New lead: ${input.name}${input.company ? ` (${input.company})` : ""}`,
    entityType: "lead",
    entityId: data.id as string,
  });
  rev();
}

/** Same as createLead but returns the new row id (for automation). */
export async function createLeadReturningId(input: {
  name: string;
  email?: string;
  company?: string;
  source?: string;
  status?: LeadStatus;
  notes?: string | null;
}): Promise<string> {
  const { supabase, workspaceId, userId } = await getWorkspace();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      workspace_id: workspaceId,
      name: input.name,
      email: input.email ?? null,
      company: input.company ?? null,
      source: input.source ?? null,
      status: input.status ?? "new",
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  await recordWorkspaceActivity(supabase, {
    workspaceId,
    actorId: userId,
    eventType: "lead_created",
    title: `New lead: ${input.name}${input.company ? ` (${input.company})` : ""}`,
    entityType: "lead",
    entityId: (data as { id: string }).id,
  });
  rev();
  return (data as { id: string }).id;
}

/** Same as createBrand but returns the new row id (for automation). */
export async function createBrandReturningId(input: {
  name: string;
  website?: string;
  industry?: string;
  color?: string;
}): Promise<string> {
  const { supabase, workspaceId, userId } = await getWorkspace();
  const { data, error } = await supabase
    .from("brands")
    .insert({
      workspace_id: workspaceId,
      name: input.name,
      website: input.website ?? null,
      industry: input.industry ?? null,
      color: input.color ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  await recordWorkspaceActivity(supabase, {
    workspaceId,
    actorId: userId,
    eventType: "brand_created",
    title: `Brand added: ${input.name}`,
    entityType: "brand",
    entityId: (data as { id: string }).id,
  });
  rev();
  return (data as { id: string }).id;
}

export async function updateLead(
  id: string,
  patch: Partial<{
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    status: LeadStatus;
    source: string | null;
    notes: string | null;
  }>,
) {
  const { supabase, workspaceId, userId } = await getWorkspace();
  const { data: before } = await supabase
    .from("leads")
    .select("status, name")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  const { error } = await supabase.from("leads").update(patch).eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw error;
  if (
    patch.status !== undefined &&
    before &&
    (before as { status: LeadStatus }).status !== patch.status
  ) {
    const nm = (before as { name: string }).name;
    await recordWorkspaceActivity(supabase, {
      workspaceId,
      actorId: userId,
      eventType: "lead_status_changed",
      title: `Lead ${nm}: ${(before as { status: LeadStatus }).status} → ${patch.status}`,
      entityType: "lead",
      entityId: id,
    });
  }
  rev();
}

export async function deleteLead(id: string) {
  const { supabase, workspaceId } = await getWorkspace();
  const { error } = await supabase.from("leads").delete().eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw error;
  rev();
}

export async function archiveLead(id: string) {
  const { supabase, workspaceId, userId } = await getWorkspace();
  const { data: row } = await supabase
    .from("leads")
    .select("name")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  const { error } = await supabase
    .from("leads")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  if (row && typeof (row as { name: string }).name === "string") {
    await recordWorkspaceActivity(supabase, {
      workspaceId,
      actorId: userId,
      eventType: "lead_archived",
      title: `Archived lead: ${(row as { name: string }).name}`,
      entityType: "lead",
      entityId: id,
    });
  }
  rev();
}

export async function restoreLead(id: string) {
  const { supabase, workspaceId, userId } = await getWorkspace();
  const { data: row } = await supabase
    .from("leads")
    .select("name")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  const { error } = await supabase
    .from("leads")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  if (row && typeof (row as { name: string }).name === "string") {
    await recordWorkspaceActivity(supabase, {
      workspaceId,
      actorId: userId,
      eventType: "lead_restored",
      title: `Restored lead: ${(row as { name: string }).name}`,
      entityType: "lead",
      entityId: id,
    });
  }
  rev();
}

export async function createBrand(input: {
  name: string;
  website?: string;
  industry?: string;
  color?: string;
}) {
  const { supabase, workspaceId, userId } = await getWorkspace();
  const { data, error } = await supabase
    .from("brands")
    .insert({
      workspace_id: workspaceId,
      name: input.name,
      website: input.website ?? null,
      industry: input.industry ?? null,
      color: input.color ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  await recordWorkspaceActivity(supabase, {
    workspaceId,
    actorId: userId,
    eventType: "brand_created",
    title: `Brand added: ${input.name}`,
    entityType: "brand",
    entityId: data.id as string,
  });
  rev();
}

export async function updateBrand(
  id: string,
  patch: Partial<{
    name: string;
    website: string | null;
    industry: string | null;
    description: string | null;
    color: string | null;
  }>,
) {
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("brands").update(patch).eq("id", id);
  if (error) throw error;
  rev();
}

export async function deleteBrand(id: string) {
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) throw error;
  rev();
}

export async function createBrandContact(input: {
  brandId: string;
  name: string;
  email?: string | null;
  role?: string | null;
  status?: BrandContactStatus;
}) {
  const { supabase, workspaceId } = await getWorkspace();
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  const { error } = await supabase.from("partner_contacts").insert({
    workspace_id: workspaceId,
    brand_id: input.brandId,
    name,
    email: input.email?.trim() ? input.email.trim() : null,
    role: input.role?.trim() ? input.role.trim() : null,
    status: input.status ?? "active",
  });
  if (error) throw error;
  rev();
}

export async function updateBrandContact(
  id: string,
  patch: Partial<{
    name: string;
    email: string | null;
    role: string | null;
    status: BrandContactStatus;
    last_contacted_at: string | null;
  }>,
) {
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("partner_contacts").update(patch).eq("id", id);
  if (error) throw error;
  rev();
}

export async function deleteBrandContact(id: string) {
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("partner_contacts").delete().eq("id", id);
  if (error) throw error;
  rev();
}

export async function createRelationshipEvent(input: {
  brandId: string;
  kind: BrandActivityKind;
  title: string;
  body?: string | null;
  amountCents?: number | null;
  occurredAt?: string | null;
}) {
  const { supabase, workspaceId, userId } = await getWorkspace();
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");
  const { error } = await supabase.from("relationship_events").insert({
    workspace_id: workspaceId,
    brand_id: input.brandId,
    kind: input.kind,
    title,
    body: input.body?.trim() ? input.body.trim() : null,
    amount_cents: input.amountCents ?? null,
    occurred_at: input.occurredAt ?? new Date().toISOString(),
  });
  if (error) throw error;
  await recordWorkspaceActivity(supabase, {
    workspaceId,
    actorId: userId,
    eventType: "brand_touchpoint",
    title: title,
    summary: input.kind,
    entityType: "brand",
    entityId: input.brandId,
  });
  rev();
}

export async function updateRelationshipEvent(
  id: string,
  patch: Partial<{
    kind: BrandActivityKind;
    title: string;
    body: string | null;
    amount_cents: number | null;
    occurred_at: string;
  }>,
) {
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("relationship_events").update(patch).eq("id", id);
  if (error) throw error;
  rev();
}

export async function deleteRelationshipEvent(id: string) {
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("relationship_events").delete().eq("id", id);
  if (error) throw error;
  rev();
}

export async function createDeal(input: {
  title: string;
  valueCents: number;
  stage?: DealStage;
  brandId?: string | null;
  leadId?: string | null;
  currency?: string;
}) {
  const { supabase, workspaceId, userId } = await getWorkspace();
  const cur = input.currency?.trim()
    ? normalizeWorkspaceCurrency(input.currency)
    : await fetchWorkspaceDefaultCurrency(supabase, workspaceId);
  const { data: last } = await supabase
    .from("deals")
    .select("position")
    .eq("workspace_id", workspaceId)
    .eq("stage", input.stage ?? "lead")
    .order("position", { ascending: false })
    .limit(1);
  const pos = (last?.[0]?.position ?? -10) + 10;
  const { data, error } = await supabase
    .from("deals")
    .insert({
      workspace_id: workspaceId,
      title: input.title,
      value_cents: input.valueCents,
      currency: cur,
      stage: input.stage ?? "lead",
      position: pos,
      brand_id: input.brandId ?? null,
      lead_id: input.leadId ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  await recordWorkspaceActivity(supabase, {
    workspaceId,
    actorId: userId,
    eventType: "deal_created",
    title: `Deal added: ${input.title}`,
    entityType: "deal",
    entityId: data.id as string,
  });
  rev();
}

export async function updateDeal(
  id: string,
  patch: Partial<{
    title: string;
    value_cents: number;
    stage: DealStage;
    position: number;
    brand_id: string | null;
    lead_id: string | null;
    close_date: string | null;
  }>,
) {
  const { supabase, workspaceId, userId } = await getWorkspace();
  const { data: before } = await supabase
    .from("deals")
    .select("stage, title")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  const { error } = await supabase
    .from("deals")
    .update(patch)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  if (
    patch.stage !== undefined &&
    before &&
    (before as { stage: DealStage }).stage !== patch.stage
  ) {
    await recordWorkspaceActivity(supabase, {
      workspaceId,
      actorId: userId,
      eventType: "deal_stage_changed",
      title: `Deal moved to ${patch.stage}`,
      summary: (before as { title: string }).title,
      entityType: "deal",
      entityId: id,
    });
  }
  rev();
}

export async function moveDeal(input: {
  id: string;
  stage: DealStage;
  position: number;
}) {
  await updateDeal(input.id, { stage: input.stage, position: input.position });
}

export async function deleteDeal(id: string) {
  const { supabase, workspaceId } = await getWorkspace();
  const { error } = await supabase.from("deals").delete().eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw error;
  rev();
}

export async function createTask(input: {
  title: string;
  dueAt?: string | null;
  reminderAt?: string | null;
  description?: string | null;
  relatedType?: TaskRelated;
  relatedId?: string | null;
}): Promise<{ task: Task }> {
  const { supabase, workspaceId } = await getWorkspace();
  const title = input.title.trim();
  if (!title) {
    throw new Error("Title is required");
  }
  const relatedType: TaskRelated | null =
    input.relatedType && input.relatedType !== "none" ? input.relatedType : null;
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      workspace_id: workspaceId,
      title,
      description: input.description?.trim() ? input.description.trim() : null,
      due_at: input.dueAt ?? null,
      reminder_at: input.reminderAt ?? null,
      related_type: relatedType,
      related_id: input.relatedId ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  rev();
  return { task: data as Task };
}

export async function updateTask(
  id: string,
  patch: Partial<{
    title: string;
    completed: boolean;
    due_at: string | null;
    reminder_at: string | null;
  }>,
) {
  const { supabase, workspaceId, userId } = await getWorkspace();
  const { data: before } = await supabase
    .from("tasks")
    .select("completed, title, workspace_id")
    .eq("id", id)
    .maybeSingle();
  if (before && (before as { workspace_id: string }).workspace_id !== workspaceId) {
    throw new Error("Task not found");
  }
  const { error } = await supabase.from("tasks").update(patch).eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw error;
  if (
    patch.completed === true &&
    before &&
    !(before as { completed: boolean }).completed
  ) {
    await recordWorkspaceActivity(supabase, {
      workspaceId,
      actorId: userId,
      eventType: "task_completed",
      title: `Task done: ${(before as { title: string }).title}`,
      entityType: "task",
      entityId: id,
    });
  }
  rev();
}

export async function deleteTask(id: string) {
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
  rev();
}

export async function createPayment(input: {
  clientName: string;
  amountCents: number;
  status?: PaymentStatus;
  dueDate?: string | null;
  dealId?: string | null;
  description?: string | null;
  currency?: string;
}) {
  const { supabase, workspaceId, userId } = await getWorkspace();
  const cur = input.currency?.trim()
    ? normalizeWorkspaceCurrency(input.currency)
    : await fetchWorkspaceDefaultCurrency(supabase, workspaceId);
  const { data, error } = await supabase
    .from("payments")
    .insert({
      workspace_id: workspaceId,
      client_name: input.clientName,
      amount_cents: input.amountCents,
      currency: cur,
      status: input.status ?? "pending",
      due_date: input.dueDate ?? null,
      deal_id: input.dealId ?? null,
      description: input.description ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  await recordWorkspaceActivity(supabase, {
    workspaceId,
    actorId: userId,
    eventType: "payment_created",
    title: `Invoice: ${input.clientName}`,
    entityType: "payment",
    entityId: data.id as string,
  });
  rev();
}

export async function updatePayment(
  id: string,
  patch: Partial<{
    client_name: string;
    amount_cents: number;
    status: PaymentStatus;
    due_date: string | null;
    paid_at: string | null;
  }>,
) {
  const { supabase, workspaceId, userId } = await getWorkspace();
  const { data: before } = await supabase
    .from("payments")
    .select("status, client_name")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  const { error } = await supabase.from("payments").update(patch).eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw error;
  if (
    patch.status === "paid" &&
    before &&
    (before as { status: PaymentStatus }).status !== "paid"
  ) {
    await recordWorkspaceActivity(supabase, {
      workspaceId,
      actorId: userId,
      eventType: "payment_received",
      title: `Payment received: ${(before as { client_name: string }).client_name}`,
      entityType: "payment",
      entityId: id,
    });
  }
  rev();
}

export async function deletePayment(id: string) {
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw error;
  rev();
}

export async function createTemplate(input: {
  name: string;
  type: TemplateType;
  body: string;
}) {
  const { supabase, workspaceId } = await getWorkspace();
  const { error } = await supabase.from("templates").insert({
    workspace_id: workspaceId,
    name: input.name,
    type: input.type,
    body: input.body,
  });
  if (error) throw error;
  revalidatePath("/templates");
}

export async function updateTemplate(
  id: string,
  patch: { name?: string; body?: string; type?: TemplateType },
) {
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("templates").update(patch).eq("id", id);
  if (error) throw error;
  revalidatePath("/templates");
}

export async function deleteTemplate(id: string) {
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("templates").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/templates");
}

export async function updateUserSettings(
  userId: string,
  patch: {
    email_digest?: boolean;
    time_zone?: string | null;
    week_starts_on?: number;
    campaign_alerts?: boolean;
    system_news?: boolean;
    locale?: string | null;
  },
) {
  const { supabase } = await getWorkspace();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) throw new Error("Unauthorized");
  const { error } = await supabase.from("user_settings").upsert(
    { user_id: userId, ...patch },
    { onConflict: "user_id" },
  );
  if (error) throw error;
  revalidatePath("/settings");
}

export async function updateProfile(input: {
  fullName: string;
  instagramHandle?: string | null;
  bio?: string | null;
  workEmail?: string | null;
  avatarUrl?: string | null;
}) {
  const { supabase } = await getWorkspace();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const patch: Record<string, unknown> = { full_name: input.fullName };
  if (input.instagramHandle !== undefined) {
    patch.instagram_handle = input.instagramHandle?.trim() || null;
  }
  if (input.bio !== undefined) {
    patch.bio = input.bio?.trim() || null;
  }
  if (input.workEmail !== undefined) {
    patch.work_email = input.workEmail?.trim() || null;
  }
  if (input.avatarUrl !== undefined) {
    patch.avatar_url = input.avatarUrl;
  }
  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) throw error;
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}
