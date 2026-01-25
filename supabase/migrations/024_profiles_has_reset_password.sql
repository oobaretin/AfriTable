-- Track whether a user has set their own password (used for pending_owner onboarding)

alter table public.profiles
  add column if not exists has_reset_password boolean not null default false;

create index if not exists profiles_has_reset_password_idx on public.profiles (has_reset_password);

