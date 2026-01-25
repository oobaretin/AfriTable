-- Audit trail for submission lifecycle actions

create table if not exists public.submission_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.restaurant_submissions (id) on delete cascade,
  event text not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create index if not exists submission_events_submission_id_created_at_idx
  on public.submission_events (submission_id, created_at desc);

create index if not exists submission_events_event_idx
  on public.submission_events (event);

alter table public.submission_events enable row level security;

-- Admins can read all events
drop policy if exists "submission_events_admin_read" on public.submission_events;
create policy "submission_events_admin_read"
on public.submission_events
for select
using (public.current_user_role() = 'admin');

-- Admins can write events
drop policy if exists "submission_events_admin_insert" on public.submission_events;
create policy "submission_events_admin_insert"
on public.submission_events
for insert
with check (public.current_user_role() = 'admin');

