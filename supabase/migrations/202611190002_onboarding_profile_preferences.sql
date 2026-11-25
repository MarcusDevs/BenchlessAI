alter table public.profiles
  add column if not exists goal text,
  add column if not exists experience text,
  add column if not exists equipment text[] not null default '{}',
  add column if not exists cardio boolean not null default false,
  add column if not exists training_days smallint[] not null default '{}',
  add column if not exists training_time time,
  add column if not exists workout_reminders boolean not null default false,
  add column if not exists session_check_ins boolean not null default true,
  add column if not exists timezone text,
  add column if not exists onboarding_answers jsonb not null default '{}'::jsonb,
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.profiles.onboarding_answers is
  'Owner-only snapshot of the onboarding answers used to personalize this account. Sensitive injury and red-flag answers are protected by profiles RLS and must not be sent to analytics.';
