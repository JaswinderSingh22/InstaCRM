-- Contacts + relationship activity for the Brands screen (legacy names).
-- Run 20260428150000_rename_brand_tables_to_partner_naming.sql after this to get
-- partner_contacts + relationship_events in the Table Editor.

create table public.brand_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  brand_id uuid not null references public.brands on delete cascade,
  name text not null,
  email text,
  role text,
  status text not null default 'active' check (status in ('active', 'pending', 'inactive')),
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index brand_contacts_workspace_brand_idx on public.brand_contacts (workspace_id, brand_id);

create table public.brand_activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  brand_id uuid not null references public.brands on delete cascade,
  kind text not null check (kind in ('email', 'payment', 'contract', 'meeting', 'note')),
  title text not null,
  body text,
  amount_cents bigint,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index brand_activities_workspace_occurred_idx on public.brand_activities (workspace_id, occurred_at desc);
create index brand_activities_brand_idx on public.brand_activities (brand_id);

create trigger brand_contacts_updated_at before update on public.brand_contacts
  for each row execute function public.set_updated_at();
create trigger brand_activities_updated_at before update on public.brand_activities
  for each row execute function public.set_updated_at();

alter table public.brand_contacts enable row level security;
alter table public.brand_activities enable row level security;

create policy "Brand contacts crud" on public.brand_contacts for all
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Brand activities crud" on public.brand_activities for all
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

grant all on public.brand_contacts to authenticated;
grant all on public.brand_activities to authenticated;
grant all on all sequences in schema public to authenticated;
