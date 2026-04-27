-- Default currency for CRM display (campaigns, deals, payment defaults, dashboard aggregates).
-- Subscription / Stripe plan prices remain USD in the product UI.
alter table public.workspaces
  add column if not exists default_currency text not null default 'INR';

comment on column public.workspaces.default_currency is 'ISO 4217 code for workspace CRM money display; billing plans are priced in USD.';
