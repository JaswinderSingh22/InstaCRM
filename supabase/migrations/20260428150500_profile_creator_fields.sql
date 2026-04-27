-- Creator profile fields + notification preferences for the Account Settings UI.

alter table public.profiles
  add column if not exists instagram_handle text,
  add column if not exists bio text,
  add column if not exists work_email text;

alter table public.user_settings
  add column if not exists campaign_alerts boolean not null default true,
  add column if not exists system_news boolean not null default false,
  add column if not exists locale text default 'en-US';

update public.user_settings
set locale = 'en-US'
where locale is null;
