-- Restaurants + rating aggregates (avg + count)
-- Uses a security-invoker view so underlying RLS on `restaurants` / `reviews` is respected.

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
  r.phone,
  r.price_range,
  r.description,
  r.images,
  r.hours,
  r.is_active,
  r.created_at,
  round(avg(rv.overall_rating)::numeric, 1)::float8 as avg_rating,
  count(rv.id)::int as review_count
from public.restaurants r
left join public.reviews rv on rv.restaurant_id = r.id
group by r.id;

