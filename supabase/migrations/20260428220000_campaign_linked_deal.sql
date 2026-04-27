alter table public.campaigns
  add column if not exists linked_deal_id uuid references public.deals (id) on delete set null;

create index if not exists campaigns_linked_deal_id_idx on public.campaigns (linked_deal_id);

comment on column public.campaigns.linked_deal_id is 'Deal auto-created from campaign pipeline (in progress → completed).';
