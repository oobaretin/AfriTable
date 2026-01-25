-- Store provenance/citations for restaurant fields (e.g. website, socials, ratings)

alter table public.restaurants
  add column if not exists sources jsonb not null default '{}'::jsonb;

create index if not exists restaurants_sources_gin_idx
  on public.restaurants using gin (sources);

