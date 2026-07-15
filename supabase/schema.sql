-- Group Camping Planner — Supabase schema.
-- This matches the migration applied to the live project.
--
-- Design: the whole trip (members, meals, checklists, grocery overrides)
-- is one JSON document per trip, keyed by the invite code from the share
-- link. The app loads the row on start, saves it (debounced) on every
-- change, and subscribes to realtime updates so all group members stay in
-- sync.

create table public.shared_trips (
  code text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.shared_trips enable row level security;

-- Simple shared-link access model: anyone with the app's publishable key
-- can read/write trips. The trip code acts as the shared secret. Do not
-- store sensitive data with this model.
create policy "read trips" on public.shared_trips
  for select using (true);
create policy "insert trips" on public.shared_trips
  for insert with check (true);
create policy "update trips" on public.shared_trips
  for update using (true);

-- Broadcast row changes so open browsers update live.
alter publication supabase_realtime add table public.shared_trips;
