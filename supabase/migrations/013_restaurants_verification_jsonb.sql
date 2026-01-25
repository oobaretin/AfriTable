-- Restaurant verification checklist (admin)
-- Stores which fields have been verified before approval.

alter table public.restaurants
add column if not exists verification jsonb default '{
  "name": false,
  "address": false,
  "phone": false,
  "hours": false,
  "photos": false,
  "description": false
}'::jsonb;

