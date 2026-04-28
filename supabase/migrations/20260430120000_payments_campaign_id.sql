-- Link CRM payments to campaigns for cascade delete and deduping automated invoices.
alter table public.payments
  add column if not exists campaign_id uuid references public.campaigns (id) on delete cascade;

create index if not exists payments_campaign_id_idx on public.payments (campaign_id)
  where campaign_id is not null;
