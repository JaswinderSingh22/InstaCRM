/** Creator brand-campaign pipeline (briefs from WhatsApp, agencies, etc.) */
export type CampaignStatus =
  | "inbox"
  | "applied"
  | "shortlisted"
  | "in_progress"
  | "posted"
  | "completed"
  | "passed";

export type CampaignCompensationType = "cash" | "barter" | "mixed" | "unknown";

export type Campaign = {
  id: string;
  workspace_id: string;
  title: string;
  status: CampaignStatus;
  position: number;
  brand_name: string | null;
  agency_name: string | null;
  compensation_summary: string | null;
  compensation_cents: number | null;
  compensation_type: CampaignCompensationType;
  deliverables: unknown;
  shoot_date: string | null;
  post_date: string | null;
  post_date_end: string | null;
  apply_url: string | null;
  location_notes: string | null;
  requirements_notes: string | null;
  source_message: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
  /** Auto-sync from campaign automation */
  linked_brand_id: string | null;
  linked_lead_id: string | null;
  auto_task_applied_id: string | null;
  auto_task_shoot_id: string | null;
  auto_task_post_id: string | null;
  auto_task_completed_id: string | null;
  /** Deal row synced from this campaign’s pipeline */
  linked_deal_id: string | null;
};

export type LeadStatus = "new" | "contacted" | "qualified" | "lost";
export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type PaymentStatus = "pending" | "paid" | "overdue" | "canceled";
export type TemplateType = "email" | "task" | "note";
export type TaskRelated = "deal" | "lead" | "brand" | "none";

export type Lead = {
  id: string;
  workspace_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: LeadStatus;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  /** When set, lead is archived (hidden from main Creators list). */
  archived_at: string | null;
};

export type Brand = {
  id: string;
  workspace_id: string;
  name: string;
  website: string | null;
  industry: string | null;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type BrandContactStatus = "active" | "pending" | "inactive";
export type BrandActivityKind = "email" | "payment" | "contract" | "meeting" | "note";

export type BrandContact = {
  id: string;
  workspace_id: string;
  brand_id: string;
  name: string;
  email: string | null;
  role: string | null;
  status: BrandContactStatus;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BrandActivity = {
  id: string;
  workspace_id: string;
  brand_id: string;
  kind: BrandActivityKind;
  title: string;
  body: string | null;
  amount_cents: number | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
};

export type Deal = {
  id: string;
  workspace_id: string;
  title: string;
  value_cents: number;
  currency: string;
  stage: DealStage;
  position: number;
  brand_id: string | null;
  lead_id: string | null;
  close_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  reminder_at: string | null;
  completed: boolean;
  related_type: TaskRelated | null;
  related_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  workspace_id: string;
  deal_id: string | null;
  /** Set when invoice is generated from a creator campaign (cascade on campaign delete). */
  campaign_id: string | null;
  client_name: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  due_date: string | null;
  paid_at: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Template = {
  id: string;
  workspace_id: string;
  name: string;
  type: TemplateType;
  body: string;
  created_at: string;
  updated_at: string;
};

/** Dashboard / API activity feed (server-recorded CRM events). */
export type WorkspaceActivityEvent = {
  id: string;
  workspace_id: string;
  actor_id: string | null;
  event_type: string;
  title: string;
  summary: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
};

export type UserSettings = {
  user_id: string;
  email_digest: boolean;
  week_starts_on: number;
  time_zone: string | null;
  /** Present after migration `20260428150500_profile_creator_fields`. */
  campaign_alerts?: boolean;
  system_news?: boolean;
  locale?: string | null;
  created_at: string;
  updated_at: string;
};
