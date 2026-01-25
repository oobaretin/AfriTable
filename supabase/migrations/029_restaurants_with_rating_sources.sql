-- Extend restaurants_with_rating view with sources

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
  r.website,
  r.instagram_handle,
  r.facebook_url,
  r.display_city,
  r.is_featured,
  r.featured_until,
  r.sources,
  coalesce(round(avg(rv.overall_rating)::numeric, 1)::float8, r.external_avg_rating) as avg_rating,
  coalesce(count(rv.id)::int, r.external_review_count) as review_count
from public.restaurants r
left join public.reviews rv on rv.restaurant_id = r.id
group by r.id;

