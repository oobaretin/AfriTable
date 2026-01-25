-- Generated display fields for faster filtering/search
-- `display_city` is derived from restaurants.address->>'city'

alter table public.restaurants
  add column if not exists display_city text
  generated always as ((address ->> 'city')) stored;

create index if not exists restaurants_display_city_idx on public.restaurants (display_city);

-- Keep restaurants_with_rating view in sync
drop view if exists public.restaurants_with_rating;

create view public.restaurants_with_rating
with (security_invoker = true)
as
select
  r.id,
  r.owner_id,
  r.name,
  r.slug,
  r.cuisine_types,
  r.address,
  r.display_city,
  r.phone,
  r.website,
  r.instagram_handle,
  r.facebook_url,
  r.price_range,
  r.description,
  r.images,
  r.hours,
  r.is_active,
  r.created_at,
  case
    when count(rv.id) > 0 then round(avg(rv.overall_rating)::numeric, 1)::float8
    else r.external_avg_rating
  end as avg_rating,
  case
    when count(rv.id) > 0 then count(rv.id)::int
    else coalesce(r.external_review_count, 0)
  end as review_count
from public.restaurants r
left join public.reviews rv on rv.restaurant_id = r.id
group by r.id;

