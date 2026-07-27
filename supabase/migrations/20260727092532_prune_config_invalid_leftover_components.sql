-- Config switching used to leave behind components the new config no longer
-- allows (rotors after switching to rim, tubes after going tubeless). They
-- persisted as hidden rows that still accrued wear (Trello #8). Going forward
-- the config action prunes them; this clears the ones already in the database.
--
-- Same guard as the action: only pristine auto-defaults are removed — a part
-- the user renamed, branded, noted, muted, or replaced is kept (still hidden)
-- so nothing they invested in is lost. Cascades to component_mounts and
-- notification_log.

delete from public.components c
where c.replaced_at is null
  and c.bike_id is not null
  and c.type <> 'custom'
  and c.brand is null and c.model is null and c.spec is null
  and c.nickname is null and c.notes is null and c.lube_type is null
  and c.muted = false
  and not exists (
    select 1 from public.components h
    where h.bike_id = c.bike_id and h.type = c.type and h.replaced_at is not null
  )
  and exists (
    select 1 from public.bikes b
    where b.id = c.bike_id and (
      (b.shifting_type = 'electronic' and c.type in ('shifter_cables', 'cables')) or
      (b.brake_type = 'disc' and c.type = 'brake_cables') or
      (b.brake_type = 'rim' and c.type in ('brake_rotor_front', 'brake_rotor_rear', 'brake_rotors')) or
      (b.tire_system = 'tubeless' and c.type in ('inner_tube_front', 'inner_tube_rear'))
    )
  );
