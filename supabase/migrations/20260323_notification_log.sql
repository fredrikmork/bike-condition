-- notification_log: tracks which wear threshold notifications have been sent
-- Unique index on (component_id, notification_type) prevents duplicate sends
-- per component install. Entries are deleted when a component is replaced.

create table if not exists notification_log (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id) on delete cascade,
  component_id       uuid not null references components(id) on delete cascade,
  notification_type  text not null check (notification_type in ('warn', 'critical')),
  sent_at            timestamptz not null default now(),
  wear_pct_at_send   int not null
);

create unique index if not exists notification_log_component_type_unique
  on notification_log(component_id, notification_type);

alter table notification_log enable row level security;

create policy "Users can read own notification_log"
  on notification_log for select
  using (user_id = auth.uid());
