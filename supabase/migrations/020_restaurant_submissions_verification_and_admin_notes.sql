-- Add verification checklist and admin notes to restaurant submissions

alter table public.restaurant_submissions
  add column if not exists verification jsonb not null default '{
    "name_verified": false,
    "address_verified": false,
    "online_presence_verified": false,
    "cuisine_verified": false,
    "duplicate_checked": false
  }',
  add column if not exists admin_notes text;

