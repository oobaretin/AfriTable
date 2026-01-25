-- Performance indexes (safe to run multiple times)

-- Restaurants
create index if not exists restaurants_is_active_idx on public.restaurants (is_active);
create index if not exists restaurants_owner_id_idx on public.restaurants (owner_id);

-- GIN for array containment queries (e.g. cuisine filter)
create index if not exists restaurants_cuisine_types_gin on public.restaurants using gin (cuisine_types);

-- Reservations
create index if not exists reservations_restaurant_date_time_idx
  on public.reservations (restaurant_id, reservation_date, reservation_time);

create index if not exists reservations_user_date_idx
  on public.reservations (user_id, reservation_date);

create index if not exists reservations_restaurant_status_date_idx
  on public.reservations (restaurant_id, status, reservation_date);

-- Reviews
create index if not exists reviews_restaurant_created_at_idx
  on public.reviews (restaurant_id, created_at desc);

