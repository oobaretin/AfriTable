-- Add optional public-facing fields to restaurants + allow seeding external ratings.
-- Also update restaurants_with_rating view to fall back to external values when there are no in-app reviews yet.

alter table public.restaurants
  add column if not exists website text,
  add column if not exists instagram_handle text,
  add column if not exists facebook_url text,
  add column if not exists external_avg_rating float8,
  add column if not exists external_review_count int;

-- Basic constraints (safe even if column already exists)
do $$
begin
  -- external_avg_rating: 0..5 (nullable)
  if not exists (
    select 1
    from pg_constraint
    where conname = 'restaurants_external_avg_rating_range'
  ) then
    alter table public.restaurants
      add constraint restaurants_external_avg_rating_range
      check (external_avg_rating is null or (external_avg_rating >= 0 and external_avg_rating <= 5));
  end if;

  -- external_review_count: >= 0 (nullable)
  if not exists (
    select 1
    from pg_constraint
    where conname = 'restaurants_external_review_count_nonneg'
  ) then
    alter table public.restaurants
      add constraint restaurants_external_review_count_nonneg
      check (external_review_count is null or external_review_count >= 0);
  end if;
end
$$;

-- Refresh the view with rating fallback logic:
-- - If there are in-app reviews, use avg/count from reviews
-- - Otherwise, use external_avg_rating/external_review_count (best-effort)
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

