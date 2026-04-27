-- Onboarding completion + JSON answers (wizard state)
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
alter table public.profiles add column if not exists onboarding_answers jsonb not null default '{}';

comment on column public.profiles.onboarding_completed_at is
  'When set, user has finished the post-login wizard; app shell is allowed.';

comment on column public.profiles.onboarding_answers is
  'Payload from onboarding steps (name, handle, metrics, etc.).';
