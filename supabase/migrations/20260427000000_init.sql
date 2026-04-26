-- InstaCRM core schema: workspaces, RLS, Stripe hooks
-- Run with: supabase db push, or execute in Supabase SQL editor

-- Extensions
create extension if not exists "uuid-ossp";

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  default_workspace_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Workspaces (tenant)
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My workspace',
  slug text,
  created_at timestamptz not null default now(),
  stripe_customer_id text,
  subscription_status text not null default 'none',
  plan text
);

-- Membership
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table public.profiles
  add constraint profiles_default_workspace_fk
  foreign key (default_workspace_id) references public.workspaces (id) on delete set null;

-- Brands
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  name text not null,
  website text,
  industry text,
  description text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Leads
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'lost')),
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Deals (Kanban)
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  title text not null,
  value_cents bigint not null default 0,
  currency text not null default 'usd',
  stage text not null default 'lead' check (
    stage in ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')
  ),
  position int not null default 0,
  brand_id uuid references public.brands on delete set null,
  lead_id uuid references public.leads on delete set null,
  close_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deals_workspace_stage_idx on public.deals (workspace_id, stage, position);

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  reminder_at timestamptz,
  completed boolean not null default false,
  related_type text check (related_type in ('deal', 'lead', 'brand', 'none') or related_type is null),
  related_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  deal_id uuid references public.deals on delete set null,
  client_name text not null,
  amount_cents bigint not null,
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue', 'canceled')),
  due_date date,
  paid_at timestamptz,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Email / note / task templates
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  name text not null,
  type text not null check (type in ('email', 'task', 'note')),
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User settings (per user, optional workspace scoping for prefs)
create table public.user_settings (
  user_id uuid primary key references auth.users on delete cascade,
  email_digest boolean not null default true,
  week_starts_on int not null default 1,
  time_zone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated_at triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger brands_updated_at before update on public.brands
  for each row execute function public.set_updated_at();
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();
create trigger deals_updated_at before update on public.deals
  for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();
create trigger templates_updated_at before update on public.templates
  for each row execute function public.set_updated_at();
create trigger user_settings_updated_at before update on public.user_settings
  for each row execute function public.set_updated_at();

-- New user: profile, workspace, member
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws_id uuid;
  slug text;
begin
  slug := 'ws-' || substr(replace(new.id::text, '-', ''), 1, 12);
  insert into public.workspaces (name, slug)
  values ('My workspace', slug)
  returning id into ws_id;

  insert into public.profiles (id, full_name, avatar_url, default_workspace_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url',
    ws_id
  );

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  insert into public.user_settings (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.brands enable row level security;
alter table public.leads enable row level security;
alter table public.deals enable row level security;
alter table public.tasks enable row level security;
alter table public.payments enable row level security;
alter table public.templates enable row level security;
alter table public.user_settings enable row level security;

-- Helper: is member of workspace
create or replace function public.is_workspace_member(_wid uuid, _uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = _wid and m.user_id = _uid
  );
$$;

-- Profiles
create policy "Users read own profile" on public.profiles for select
  using (id = auth.uid());
create policy "Users update own profile" on public.profiles for update
  using (id = auth.uid());

-- Workspaces: members only
create policy "Members select workspace" on public.workspaces for select
  using (public.is_workspace_member(id, auth.uid()));
create policy "Owner updates workspace" on public.workspaces for update
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

-- Workspace members: visible to same workspace members
create policy "Members see membership" on public.workspace_members for select
  using (public.is_workspace_member(workspace_id, auth.uid()));

-- Data tables: workspace scoping
create policy "Brands crud" on public.brands for all
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Leads crud" on public.leads for all
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Deals crud" on public.deals for all
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Tasks crud" on public.tasks for all
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Payments crud" on public.payments for all
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Templates crud" on public.templates for all
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

create policy "User settings self" on public.user_settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Service role can bypass; anon uses JWT only in app

-- Storage (optional file uploads later): skip for now

-- Grant
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

comment on table public.workspaces is 'InstaCRM tenant; Stripe customer id stored here.';
