-- Add event_type column to stamps table for special event stamps (like Carnival challenge)
-- This allows stamps to be created without requiring a photo or reservation

alter table public.stamps
  add column if not exists event_type text;

-- Make reservation_id and restaurant_id nullable for event stamps
alter table public.stamps
  alter column reservation_id drop not null,
  alter column restaurant_id drop not null,
  alter column photo_url drop not null;

-- Add index for event_type lookups
create index if not exists stamps_event_type_idx on public.stamps (event_type) where event_type is not null;

-- Add comment
comment on column public.stamps.event_type is 'Type of event stamp (e.g., "carnival_2026"). Null for regular photo stamps.';
