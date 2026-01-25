-- Track when a restaurant listing was published (became active)

alter table public.restaurants
  add column if not exists published_at timestamptz;

-- Backfill: if already active, assume it was published at creation time (better than "now" for history).
update public.restaurants
set published_at = coalesce(published_at, created_at)
where is_active = true;

-- Automatically stamp published_at whenever a restaurant becomes active.
create or replace function public.set_restaurant_published_at()
returns trigger
language plpgsql
as $$
begin
  -- On insert: if active and missing published_at, stamp it.
  if (tg_op = 'INSERT') then
    if new.is_active = true and new.published_at is null then
      new.published_at := now();
    end if;
    return new;
  end if;

  -- On update: if transitioning to active and missing published_at, stamp it.
  if (tg_op = 'UPDATE') then
    if old.is_active is distinct from true and new.is_active = true and new.published_at is null then
      new.published_at := now();
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_restaurant_published_at on public.restaurants;
create trigger trg_set_restaurant_published_at
before insert or update of is_active on public.restaurants
for each row
execute function public.set_restaurant_published_at();

create index if not exists restaurants_published_at_idx on public.restaurants (published_at desc);

