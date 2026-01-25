-- Community-submitted restaurants (pending review)

create table if not exists public.restaurant_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state text not null,
  cuisine_types text[],
  address text,
  phone text,
  website text,
  notes text,
  submitted_by_email text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Basic guardrails for status (keep flexible, but prevent arbitrary values)
alter table public.restaurant_submissions
  drop constraint if exists restaurant_submissions_status_check;

alter table public.restaurant_submissions
  add constraint restaurant_submissions_status_check
  check (status in ('pending', 'approved', 'rejected', 'converted'));

create index if not exists restaurant_submissions_status_created_at_idx
  on public.restaurant_submissions (status, created_at desc);

create index if not exists restaurant_submissions_city_state_idx
  on public.restaurant_submissions (city, state);

alter table public.restaurant_submissions enable row level security;

-- Allow anyone (including anon) to submit; force status to start as pending.
drop policy if exists "restaurant_submissions_insert" on public.restaurant_submissions;
create policy "restaurant_submissions_insert"
on public.restaurant_submissions
for insert
with check (
  status = 'pending'
  and length(coalesce(submitted_by_email, '')) > 3
);

-- Admins can view all submissions
drop policy if exists "restaurant_submissions_admin_read" on public.restaurant_submissions;
create policy "restaurant_submissions_admin_read"
on public.restaurant_submissions
for select
using (public.current_user_role() = 'admin');

-- Admins can update status/fields during review
drop policy if exists "restaurant_submissions_admin_update" on public.restaurant_submissions;
create policy "restaurant_submissions_admin_update"
on public.restaurant_submissions
for update
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

