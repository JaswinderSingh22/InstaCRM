-- Creator campaign pipeline (WhatsApp / brief → applied → done)
create type public.campaign_status as enum (
  'inbox',
  'applied',
  'shortlisted',
  'in_progress',
  'posted',
  'completed',
  'passed'
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  status public.campaign_status not null default 'inbox',
  position integer not null default 0,
  brand_name text,
  agency_name text,
  compensation_summary text,
  compensation_cents integer,
  compensation_type text not null default 'unknown'
    check (compensation_type in ('cash', 'barter', 'mixed', 'unknown')),
  deliverables jsonb not null default '[]'::jsonb,
  shoot_date date,
  post_date date,
  post_date_end date,
  apply_url text,
  location_notes text,
  requirements_notes text,
  source_message text,
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index campaigns_workspace_status_position_idx
  on public.campaigns (workspace_id, status, position);

alter table public.campaigns enable row level security;

create policy "campaigns_select_own_workspace"
  on public.campaigns for select
  using (
    workspace_id = (
      select default_workspace_id
      from public.profiles
      where id = auth.uid()
    )
  );

create policy "campaigns_insert_own_workspace"
  on public.campaigns for insert
  with check (
    workspace_id = (
      select default_workspace_id
      from public.profiles
      where id = auth.uid()
    )
  );

create policy "campaigns_update_own_workspace"
  on public.campaigns for update
  using (
    workspace_id = (
      select default_workspace_id
      from public.profiles
      where id = auth.uid()
    )
  );

create policy "campaigns_delete_own_workspace"
  on public.campaigns for delete
  using (
    workspace_id = (
      select default_workspace_id
      from public.profiles
      where id = auth.uid()
    )
  );
