-- Track owner invitation status for community submissions

alter table public.restaurant_submissions
  add column if not exists owner_invited boolean not null default false,
  add column if not exists owner_invited_at timestamptz,
  add column if not exists owner_email text;

create index if not exists restaurant_submissions_owner_invited_idx
  on public.restaurant_submissions (owner_invited);

