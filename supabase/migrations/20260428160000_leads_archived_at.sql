-- Soft-archive leads (hide from main list; restore later)
alter table public.leads
  add column if not exists archived_at timestamptz;

create index if not exists leads_workspace_archived_idx
  on public.leads (workspace_id, archived_at);
