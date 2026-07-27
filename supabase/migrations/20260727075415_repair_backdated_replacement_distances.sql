-- Replacements logged with a date before tracking started froze the part's
-- current_distance at whatever the sync had accumulated up to the moment the
-- user clicked — the full bike total — instead of the kilometres actually
-- ridden by the stated date. Every first-generation part replaced this way
-- showed the same number (Trello #5).
--
-- Scope: rows where replaced_at < installed_at, which are unambiguously
-- backdated ("on the bike until <date>", installed_at is just tracking-start).
-- The honest figure is the activity record before the replacement date, with
-- indoor rides excluded for the types that pause on the trainer — the same
-- rule the live computation applies to closed windows.

-- 1. Their mount rows: stretch mounted_at back to the bike's first ride so
--    the window covers what the part actually saw (was: tracking-start, which
--    put mount AFTER unmount).
update public.component_mounts m
set mounted_at = coalesce(
    (select min(a.start_date) from public.activities a where a.bike_id = m.bike_id),
    c.replaced_at)
from public.components c
where c.id = m.component_id
  and c.replaced_at is not null
  and c.replaced_at < c.installed_at
  and m.mounted_at > c.replaced_at;

-- 2. Honest unmount snapshot: baseline + rides inside the window (indoor
--    included — Strava's gear total includes them), capped at the bike total.
update public.component_mounts m
set unmounted_at = c.replaced_at,
    bike_distance_at_unmount = least(
      m.bike_distance_at_mount + coalesce((
        select sum(a.distance)::bigint from public.activities a
        where a.bike_id = m.bike_id
          and a.start_date >= m.mounted_at
          and a.start_date < c.replaced_at), 0),
      coalesce((select b.total_distance::bigint from public.bikes b where b.id = m.bike_id), 0))
from public.components c
where c.id = m.component_id
  and c.replaced_at is not null
  and c.replaced_at < c.installed_at;

-- 3. The frozen distance itself.
update public.components c
set current_distance = coalesce((
  select sum(a.distance)::int from public.activities a
  where a.bike_id = c.bike_id
    and a.start_date < c.replaced_at
    and not (
      c.type in ('tire_front','tire_rear','inner_tube_front','inner_tube_rear',
                 'brake_rotor_front','brake_rotor_rear','brake_pads_front','brake_pads_rear','brake_cables')
      and (a.trainer or a.activity_type = 'VirtualRide'))
), 0)
where c.replaced_at is not null
  and c.replaced_at < c.installed_at
  and c.bike_id is not null;
