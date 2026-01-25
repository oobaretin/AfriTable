-- Token-based owner invitation links for submissions
-- Store only a hash of the token for security.

alter table public.restaurant_submissions
  add column if not exists owner_invite_token_hash text,
  add column if not exists owner_invite_token_expires_at timestamptz,
  add column if not exists owner_invite_token_used_at timestamptz;

create unique index if not exists restaurant_submissions_owner_invite_token_hash_uniq
  on public.restaurant_submissions (owner_invite_token_hash)
  where owner_invite_token_hash is not null;

