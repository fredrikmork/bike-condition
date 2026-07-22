-- The drivetrain becomes a container part like the wheels: one row per bike
-- that the chain, cassette, chainrings, bottom bracket and pulley wheels hang
-- off, so the groupset can carry its own brand, model and notes.

insert into public.components
  (bike_id, user_id, name, type, recommended_distance, current_distance, bike_distance_at_install, installed_at)
select
  b.id,
  b.user_id,
  'Drivetrain',
  'drivetrain',
  0,
  0,
  0,
  coalesce(
    (select min(c.installed_at) from public.components c
      where c.bike_id = b.id and c.replaced_at is null),
    b.created_at,
    now()
  )
from public.bikes b
where not exists (
  select 1 from public.components c
  where c.bike_id = b.id and c.type = 'drivetrain' and c.replaced_at is null
);

insert into public.component_mounts (component_id, bike_id, mounted_at, bike_distance_at_mount)
select c.id, c.bike_id, c.installed_at, 0
from public.components c
where c.type = 'drivetrain'
  and c.bike_id is not null
  and not exists (select 1 from public.component_mounts m where m.component_id = c.id);

update public.components ch
set parent_component_id = d.id
from public.components d
where d.bike_id = ch.bike_id
  and d.type = 'drivetrain'
  and d.replaced_at is null
  and ch.parent_component_id is null
  and ch.type in ('chain', 'cassette', 'chainrings', 'bottom_bracket', 'pulley_wheels');
