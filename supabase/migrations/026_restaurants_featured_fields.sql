-- Featured restaurants (marketing / editorial picks)

alter table public.restaurants
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_until timestamptz;

create index if not exists restaurants_is_featured_idx on public.restaurants (is_featured);
create index if not exists restaurants_featured_until_idx on public.restaurants (featured_until);

