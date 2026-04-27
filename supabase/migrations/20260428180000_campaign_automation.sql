-- Link campaigns to auto-created brands, leads, and calendar tasks
alter table public.campaigns
  add column if not exists linked_brand_id uuid references public.brands (id) on delete set null,
  add column if not exists linked_lead_id uuid references public.leads (id) on delete set null,
  add column if not exists auto_task_applied_id uuid references public.tasks (id) on delete set null,
  add column if not exists auto_task_shoot_id uuid references public.tasks (id) on delete set null,
  add column if not exists auto_task_post_id uuid references public.tasks (id) on delete set null,
  add column if not exists auto_task_completed_id uuid references public.tasks (id) on delete set null;

create index if not exists campaigns_linked_brand_idx on public.campaigns (linked_brand_id);
create index if not exists campaigns_linked_lead_idx on public.campaigns (linked_lead_id);
