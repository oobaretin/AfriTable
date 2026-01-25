-- Dashboard support fields:
-- - reservations: internal_note, assigned_table_id
-- - availability_settings: online_reservations_enabled, buffer_minutes
-- - reservation_blocks: block-out dates

alter table public.reservations
  add column if not exists internal_note text,
  add column if not exists assigned_table_id uuid references public.restaurant_tables (id) on delete set null;

alter table public.availability_settings
  add column if not exists online_reservations_enabled boolean not null default true,
  add column if not exists buffer_minutes int not null default 0;

create table if not exists public.reservation_blocks (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  block_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint reservation_blocks_unique unique (restaurant_id, block_date)
);

alter table public.reservation_blocks enable row level security;

-- Owners/admin can manage blocks; public can read active restaurant blocks? (not necessary for MVP)
drop policy if exists "reservation_blocks_owner_manage" on public.reservation_blocks;
create policy "reservation_blocks_owner_manage"
on public.reservation_blocks
for all
using (
  exists (
    select 1 from public.restaurants r
    where r.id = reservation_blocks.restaurant_id
      and (r.owner_id = auth.uid() or public.current_user_role() = 'admin')
  )
)
with check (
  exists (
    select 1 from public.restaurants r
    where r.id = reservation_blocks.restaurant_id
      and (r.owner_id = auth.uid() or public.current_user_role() = 'admin')
  )
);

