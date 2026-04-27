-- Unified workspace activity feed (dashboard + API). Populated from server actions.
create table public.workspace_activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor_id uuid,
  event_type text not null,
  title text not null,
  summary text,
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index workspace_activity_events_ws_created_idx
  on public.workspace_activity_events (workspace_id, created_at desc);

alter table public.workspace_activity_events enable row level security;

create policy "workspace_activity_events_select_own_workspace"
  on public.workspace_activity_events for select
  using (
    workspace_id = (
      select default_workspace_id
      from public.profiles
      where id = auth.uid()
    )
  );

create policy "workspace_activity_events_insert_own_workspace"
  on public.workspace_activity_events for insert
  with check (
    workspace_id = (
      select default_workspace_id
      from public.profiles
      where id = auth.uid()
    )
  );
