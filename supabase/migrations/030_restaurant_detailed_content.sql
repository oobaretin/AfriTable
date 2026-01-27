-- Add detailed content fields for restaurant pages
-- These fields allow restaurants to have rich About, Story, Cultural Roots, Special Features, and Menu sections

alter table public.restaurants
  add column if not exists our_story text,
  add column if not exists cultural_roots text,
  add column if not exists special_features text,
  add column if not exists menu jsonb default '{}'::jsonb;

-- Menu structure will be:
-- {
--   "appetizers": [{"name": "...", "description": "...", "price": "...", "tags": [...]}],
--   "mains": [...],
--   "desserts": [...],
--   "drinks": [...],
--   "menu_pdf_url": "..." (optional)
-- }

create index if not exists restaurants_menu_gin_idx
  on public.restaurants using gin (menu);

-- Update the restaurants_with_rating view to include these new fields
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
  r.our_story,
  r.cultural_roots,
  r.special_features,
  r.menu,
  r.images,
  r.hours,
  r.is_active,
  r.created_at,
  r.is_featured,
  r.featured_until,
  r.sources,
  coalesce(round(avg(rv.overall_rating)::numeric, 1)::float8, r.external_avg_rating) as avg_rating,
  coalesce(count(rv.id)::int, r.external_review_count) as review_count
from public.restaurants r
left join public.reviews rv on rv.restaurant_id = r.id
group by r.id;
