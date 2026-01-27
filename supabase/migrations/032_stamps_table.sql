-- Create stamps table for user-generated content (social sharing)
-- This table stores photos and reviews that users share from their dining experiences

create table if not exists public.stamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  photo_url text not null,
  review_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists stamps_user_id_idx on public.stamps (user_id);
create index if not exists stamps_restaurant_id_idx on public.stamps (restaurant_id);
create index if not exists stamps_created_at_idx on public.stamps (created_at desc);
create index if not exists stamps_reservation_id_idx on public.stamps (reservation_id);

-- RLS Policies
alter table public.stamps enable row level security;

-- Users can view all stamps (public feed)
create policy "stamps_select_public" on public.stamps
  for select
  using (true);

-- Users can insert their own stamps
create policy "stamps_insert_own" on public.stamps
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own stamps
create policy "stamps_update_own" on public.stamps
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own stamps
create policy "stamps_delete_own" on public.stamps
  for delete
  using (auth.uid() = user_id);

-- Trigger to update updated_at
create trigger stamps_updated_at
  before update on public.stamps
  for each row
  execute function public.set_updated_at();
