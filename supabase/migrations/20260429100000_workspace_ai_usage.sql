-- Track monthly AI campaign-brief parse usage per workspace (UTC calendar month).
alter table public.workspaces
  add column if not exists ai_brief_parses_count integer not null default 0,
  add column if not exists ai_brief_parses_period text;

comment on column public.workspaces.ai_brief_parses_count is 'AI campaign brief parses in the current UTC calendar month.';
comment on column public.workspaces.ai_brief_parses_period is 'YYYY-MM (UTC) matching ai_brief_parses_count.';
