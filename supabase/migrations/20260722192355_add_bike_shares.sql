-- Public share links for a bike: a token grants read-only access to that
-- bike's summary (components, wear, replacement history) and nothing else.
-- Built for sale listings — the link goes in a Finn.no ad.

create table public.bike_shares (
  id uuid primary key default gen_random_uuid(),
  bike_id uuid not null references public.bikes(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  -- 128-bit random, base64url — the token IS the access control, so it must
  -- be unguessable. Generated in the server action, never client-side.
  token text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index idx_bike_shares_bike on public.bike_shares(bike_id);

-- Service-role access only, like every other table: the app never queries
-- Supabase from the client.
alter table public.bike_shares enable row level security;
