-- User-facing features support:
-- - profile preferences fields
-- - reservation notifications log for cron idempotency

alter table public.profiles
  add column if not exists city text,
  add column if not exists default_party_size int,
  add column if not exists favorite_cuisines text[] not null default '{}',
  add column if not exists dietary_restrictions text[] not null default '{}',
  add column if not exists email_prefs jsonb not null default '{}'::jsonb,
  add column if not exists sms_opt_in boolean not null default false,
  add column if not exists no_show_count int not null default 0;

create table if not exists public.reservation_notifications (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  type text not null,
  sent_at timestamptz not null default now(),
  constraint reservation_notifications_unique unique (reservation_id, type)
);

alter table public.reservation_notifications enable row level security;

-- Only restaurant owners/admin can read (for debugging), and service role will be used for cron writes.
drop policy if exists "reservation_notifications_owner_read" on public.reservation_notifications;
create policy "reservation_notifications_owner_read"
on public.reservation_notifications
for select
using (
  exists (
    select 1 from public.reservations res
    join public.restaurants r on r.id = res.restaurant_id
    where res.id = reservation_notifications.reservation_id
      and (r.owner_id = auth.uid() or public.current_user_role() = 'admin')
  )
);

