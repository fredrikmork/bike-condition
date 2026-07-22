-- Wheels become container parts: a components row of type wheel_front/wheel_rear
-- that the tire, inner tube and rotor hang off via parent_component_id.
-- Containers carry no wear of their own (recommended_distance = 0), which also
-- keeps them out of the notification query (it filters recommended_distance > 0).

alter table public.components
  add column if not exists parent_component_id uuid references public.components(id) on delete set null;

comment on column public.components.parent_component_id is
  'Container part this component sits on (e.g. a tire on its wheel). Containers are rows of type wheel_front/wheel_rear with recommended_distance = 0.';

create index if not exists idx_components_parent
  on public.components(parent_component_id)
  where parent_component_id is not null;

-- Every bike gets two wheels, retired ones included so their groups still render.
insert into public.components
  (bike_id, user_id, name, type, recommended_distance, current_distance, bike_distance_at_install, installed_at)
select
  b.id,
  b.user_id,
  s.name,
  s.type,
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
cross join (values
  ('wheel_front', 'Front Wheel'),
  ('wheel_rear', 'Rear Wheel')
) as s(type, name)
where not exists (
  select 1 from public.components c
  where c.bike_id = b.id and c.type = s.type and c.replaced_at is null
);

-- Containers need the open mount row every part is expected to have.
insert into public.component_mounts (component_id, bike_id, mounted_at, bike_distance_at_mount)
select c.id, c.bike_id, c.installed_at, 0
from public.components c
where c.type in ('wheel_front', 'wheel_rear')
  and c.bike_id is not null
  and not exists (select 1 from public.component_mounts m where m.component_id = c.id);

-- Hang existing wheel parts off the container on their side.
update public.components ch
set parent_component_id = w.id
from public.components w
where w.bike_id = ch.bike_id
  and w.replaced_at is null
  and ch.parent_component_id is null
  and (
       (w.type = 'wheel_front' and ch.type in ('tire_front', 'inner_tube_front', 'brake_rotor_front'))
    or (w.type = 'wheel_rear'  and ch.type in ('tire_rear', 'inner_tube_rear', 'brake_rotor_rear'))
  );
