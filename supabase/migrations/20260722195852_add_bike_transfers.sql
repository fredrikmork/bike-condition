-- Bike transfers: hand a bike — components, wear, replacement history — to
-- another user. The buyer opens an invite link, signs in and accepts.
--
-- A transferred bike arrives unlinked from Strava (strava_gear_id NULL): the
-- seller's gear id means nothing in the buyer's Strava account. The buyer
-- links it to their own gear afterwards; until then the bike is frozen at its
-- transfer mileage. Hence strava_gear_id becomes nullable here.

alter table public.bikes alter column strava_gear_id drop not null;

comment on column public.bikes.strava_gear_id is
  'Strava gear id in the owner''s account. NULL = not linked (freshly transferred); sync ignores unlinked bikes and their distance stays frozen until the owner links their own gear.';

create table public.bike_transfers (
  id uuid primary key default gen_random_uuid(),
  bike_id uuid not null references public.bikes(id) on delete cascade,
  seller_user_id uuid not null references public.users(id) on delete cascade,
  buyer_user_id uuid references public.users(id) on delete set null,
  -- What the bike was linked to in the seller's Strava at transfer time.
  -- Kept so the seller's next sync does not recreate the sold bike from the
  -- gear that still sits in their Strava account.
  seller_strava_gear_id text,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  cancelled_at timestamptz
);

create index idx_bike_transfers_bike on public.bike_transfers(bike_id);
create index idx_bike_transfers_seller on public.bike_transfers(seller_user_id);

alter table public.bike_transfers enable row level security;
