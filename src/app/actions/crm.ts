"use server";

import { getWorkspaceContextOrThrow } from "@/lib/crm/server-workspace";
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
  return { supabase: c.supabase, workspaceId: c.workspaceId };
}

function rev() {
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/deals");
  revalidatePath("/brands");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/payments");
  revalidatePath("/templates");
}

export async function createLead(input: {
  name: string;
  email?: string;
  company?: string;
  source?: string;
  status?: LeadStatus;
  notes?: string | null;
}) {
  const { supabase, workspaceId } = await getWorkspace();
  const { error } = await supabase.from("leads").insert({
    workspace_id: workspaceId,
    name: input.name,
    email: input.email ?? null,
    company: input.company ?? null,
    source: input.source ?? null,
    status: input.status ?? "new",
    notes: input.notes ?? null,
  });
  if (error) throw error;
  rev();
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
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("leads").update(patch).eq("id", id);
  if (error) throw error;
  rev();
}

export async function deleteLead(id: string) {
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
  rev();
}

export async function createBrand(input: {
  name: string;
  website?: string;
  industry?: string;
  color?: string;
}) {
  const { supabase, workspaceId } = await getWorkspace();
  const { error } = await supabase.from("brands").insert({
    workspace_id: workspaceId,
    name: input.name,
    website: input.website ?? null,
    industry: input.industry ?? null,
    color: input.color ?? null,
  });
  if (error) throw error;
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
  const { supabase, workspaceId } = await getWorkspace();
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
}) {
  const { supabase, workspaceId } = await getWorkspace();
  const { data: last } = await supabase
    .from("deals")
    .select("position")
    .eq("workspace_id", workspaceId)
    .eq("stage", input.stage ?? "lead")
    .order("position", { ascending: false })
    .limit(1);
  const pos = (last?.[0]?.position ?? 0) + 1;
  const { error } = await supabase.from("deals").insert({
    workspace_id: workspaceId,
    title: input.title,
    value_cents: input.valueCents,
    stage: input.stage ?? "lead",
    position: pos,
    brand_id: input.brandId ?? null,
    lead_id: input.leadId ?? null,
  });
  if (error) throw error;
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
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("deals").update(patch).eq("id", id);
  if (error) throw error;
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
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("deals").delete().eq("id", id);
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
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("tasks").update(patch).eq("id", id);
  if (error) throw error;
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
}) {
  const { supabase, workspaceId } = await getWorkspace();
  const { error } = await supabase.from("payments").insert({
    workspace_id: workspaceId,
    client_name: input.clientName,
    amount_cents: input.amountCents,
    status: input.status ?? "pending",
    due_date: input.dueDate ?? null,
    deal_id: input.dealId ?? null,
    description: input.description ?? null,
  });
  if (error) throw error;
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
  const { supabase } = await getWorkspace();
  const { error } = await supabase.from("payments").update(patch).eq("id", id);
  if (error) throw error;
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
