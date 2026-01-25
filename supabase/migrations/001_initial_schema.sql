-- AfriTable initial schema
-- Creates core tables + enums + RLS policies.

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('diner', 'restaurant_owner', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'reservation_status') then
    create type public.reservation_status as enum (
      'pending',
      'confirmed',
      'seated',
      'completed',
      'cancelled',
      'no_show'
    );
  end if;
end
$$;

-- Helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'diner',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- 2) restaurants
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null,
  slug text not null unique,
  cuisine_types text[] not null default '{}',
  address jsonb,
  phone text,
  price_range int not null check (price_range between 1 and 4),
  description text,
  images text[] not null default '{}',
  hours jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists restaurants_owner_id_idx on public.restaurants (owner_id);
create index if not exists restaurants_is_active_idx on public.restaurants (is_active);
create index if not exists restaurants_slug_idx on public.restaurants (slug);

-- 3) restaurant_tables
create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_number text not null,
  capacity int not null check (capacity > 0),
  is_active boolean not null default true
);

create index if not exists restaurant_tables_restaurant_id_idx on public.restaurant_tables (restaurant_id);

-- 4) availability_settings
create table if not exists public.availability_settings (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references public.restaurants (id) on delete cascade,
  slot_duration_minutes int not null default 90 check (slot_duration_minutes > 0),
  advance_booking_days int not null default 30 check (advance_booking_days >= 0),
  same_day_cutoff_hours int not null default 2 check (same_day_cutoff_hours >= 0),
  max_party_size int not null default 20 check (max_party_size > 0),
  operating_hours jsonb not null default '[]'::jsonb
);

-- 5) reservations
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reservation_date date not null,
  reservation_time time not null,
  party_size int not null check (party_size > 0),
  status public.reservation_status not null default 'pending',
  special_requests text,
  occasion text,
  guest_name text,
  guest_email text,
  guest_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservations_restaurant_id_idx on public.reservations (restaurant_id);
create index if not exists reservations_user_id_idx on public.reservations (user_id);
create index if not exists reservations_date_time_idx on public.reservations (reservation_date, reservation_time);

drop trigger if exists set_reservations_updated_at on public.reservations;
create trigger set_reservations_updated_at
before update on public.reservations
for each row
execute function public.set_updated_at();

-- 6) reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  overall_rating int not null check (overall_rating between 1 and 5),
  food_rating int check (food_rating between 1 and 5),
  service_rating int check (service_rating between 1 and 5),
  ambiance_rating int check (ambiance_rating between 1 and 5),
  review_text text,
  photos text[] not null default '{}',
  restaurant_response text,
  created_at timestamptz not null default now()
);

create index if not exists reviews_restaurant_id_idx on public.reviews (restaurant_id);
create index if not exists reviews_user_id_idx on public.reviews (user_id);

-- 7) favorites
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_user_restaurant_unique unique (user_id, restaurant_id)
);

create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists favorites_restaurant_id_idx on public.favorites (restaurant_id);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.availability_settings enable row level security;
alter table public.reservations enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;

-- Convenience: current user role (safe to use in policies)
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- profiles: read all, update own
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all"
on public.profiles
for select
using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- restaurants: public read active, owners update own, owners/admin insert
drop policy if exists "restaurants_public_read_active" on public.restaurants;
create policy "restaurants_public_read_active"
on public.restaurants
for select
using (is_active = true);

drop policy if exists "restaurants_owner_insert" on public.restaurants;
create policy "restaurants_owner_insert"
on public.restaurants
for insert
with check (
  auth.uid() = owner_id
  and public.current_user_role() in ('restaurant_owner', 'admin')
);

drop policy if exists "restaurants_owner_update" on public.restaurants;
create policy "restaurants_owner_update"
on public.restaurants
for update
using (
  auth.uid() = owner_id
  or public.current_user_role() = 'admin'
)
with check (
  auth.uid() = owner_id
  or public.current_user_role() = 'admin'
);

-- restaurant_tables: public read for active restaurants; owners manage their own
drop policy if exists "restaurant_tables_public_read" on public.restaurant_tables;
create policy "restaurant_tables_public_read"
on public.restaurant_tables
for select
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_tables.restaurant_id
      and r.is_active = true
  )
);

drop policy if exists "restaurant_tables_owner_manage" on public.restaurant_tables;
create policy "restaurant_tables_owner_manage"
on public.restaurant_tables
for all
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_tables.restaurant_id
      and (r.owner_id = auth.uid() or public.current_user_role() = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_tables.restaurant_id
      and (r.owner_id = auth.uid() or public.current_user_role() = 'admin')
  )
);

-- availability_settings: public read for active restaurants; owners manage their own
drop policy if exists "availability_public_read" on public.availability_settings;
create policy "availability_public_read"
on public.availability_settings
for select
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = availability_settings.restaurant_id
      and r.is_active = true
  )
);

drop policy if exists "availability_owner_manage" on public.availability_settings;
create policy "availability_owner_manage"
on public.availability_settings
for all
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = availability_settings.restaurant_id
      and (r.owner_id = auth.uid() or public.current_user_role() = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.restaurants r
    where r.id = availability_settings.restaurant_id
      and (r.owner_id = auth.uid() or public.current_user_role() = 'admin')
  )
);

-- reservations: users read/update own; owners read/update for their restaurants
drop policy if exists "reservations_read_own_or_owner" on public.reservations;
create policy "reservations_read_own_or_owner"
on public.reservations
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.restaurants r
    where r.id = reservations.restaurant_id
      and r.owner_id = auth.uid()
  )
  or public.current_user_role() = 'admin'
);

drop policy if exists "reservations_insert_own" on public.reservations;
create policy "reservations_insert_own"
on public.reservations
for insert
with check (user_id = auth.uid());

drop policy if exists "reservations_update_own_or_owner" on public.reservations;
create policy "reservations_update_own_or_owner"
on public.reservations
for update
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.restaurants r
    where r.id = reservations.restaurant_id
      and r.owner_id = auth.uid()
  )
  or public.current_user_role() = 'admin'
)
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.restaurants r
    where r.id = reservations.restaurant_id
      and r.owner_id = auth.uid()
  )
  or public.current_user_role() = 'admin'
);

-- reviews: public read; users can create reviews for their completed reservations
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read"
on public.reviews
for select
using (true);

drop policy if exists "reviews_insert_for_completed_reservation" on public.reviews;
create policy "reviews_insert_for_completed_reservation"
on public.reviews
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.reservations res
    where res.id = reviews.reservation_id
      and res.user_id = auth.uid()
      and res.status = 'completed'
      and res.restaurant_id = reviews.restaurant_id
  )
);

-- favorites: users manage their own favorites
drop policy if exists "favorites_manage_own" on public.favorites;
create policy "favorites_manage_own"
on public.favorites
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

