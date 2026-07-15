-- Group Camping Planner — optional Supabase schema
-- =====================================================
--
-- This app runs entirely with browser localStorage by default (see the
-- README). This schema is provided for anyone who wants to upgrade to real
-- multi-device / multi-browser sharing using Supabase (hosted Postgres).
--
-- It is NOT required to run the app. Nothing in the app currently talks to
-- Supabase — wiring it up means adding a data adapter that replaces the
-- persistence layer in lib/store.tsx with reads/writes against these tables
-- (e.g. via @supabase/supabase-js) instead of localStorage.
--
-- How to use:
--   1. Create a project at https://supabase.com.
--   2. Open the SQL editor and run this whole file once.
--   3. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your
--      environment.
--   4. Enable Row Level Security (see note near the bottom) and write
--      policies before you put this in front of real users — as written,
--      RLS is OFF and every table is wide open to anyone with the anon key.
--
-- The shape mirrors lib/types.ts as closely as SQL allows:
--   Trip      -> trips
--   Member    -> members
--   Meal      -> meals (+ ingredients)
--   ChecklistItem -> checklist_items (gear / kitchen / personal, via `list`)
--   GroceryLine / ManualGroceryItem -> grocery_items
--
-- =====================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Trips
-- ---------------------------------------------------------------------
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our Camping Trip',
  location text not null default '',
  arrival_date date,
  departure_date date,
  adults integer not null default 0,
  children integer not null default 0,
  invite_code text not null unique,
  notes text not null default '',
  emergency_contacts text not null default '',
  campground_rules text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Members (people in the group)
-- ---------------------------------------------------------------------
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  name text not null,
  dietary_restrictions text not null default '',
  allergies text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists members_trip_id_idx on members (trip_id);

-- ---------------------------------------------------------------------
-- Meals
-- ---------------------------------------------------------------------
create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  name text not null,
  date date,
  type text not null default 'dinner'
    check (type in ('breakfast', 'lunch', 'dinner', 'snack')),
  servings integer not null default 1,
  menu text not null default '',
  assigned_member_id uuid references members (id) on delete set null,
  notes text not null default '',
  dietary_options text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists meals_trip_id_idx on meals (trip_id);

-- Ingredients belonging to a meal (used to auto-build the grocery list).
create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references meals (id) on delete cascade,
  name text not null,
  quantity numeric not null default 1,
  unit text not null default '',
  category text not null default 'Other',
  created_at timestamptz not null default now()
);

create index if not exists ingredients_meal_id_idx on ingredients (meal_id);

-- ---------------------------------------------------------------------
-- Checklist items: shared gear, shared kitchen supplies, and personal
-- packing lists all use one table, distinguished by `list`.
-- Personal items have a non-null member_id; gear/kitchen items do not.
-- ---------------------------------------------------------------------
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  list text not null check (list in ('gear', 'kitchen', 'personal')),
  member_id uuid references members (id) on delete cascade,
  name text not null,
  category text not null default 'Other',
  quantity_needed integer not null default 1,
  quantity_assigned integer not null default 0,
  assigned_member_id uuid references members (id) on delete set null,
  status text not null default 'unassigned'
    check (status in
      ('unassigned', 'assigned', 'confirmed', 'purchased', 'packed', 'complete')),
  notes text not null default '',
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  -- Personal items must belong to a member; gear/kitchen items must not.
  constraint checklist_items_personal_member check (
    (list = 'personal' and member_id is not null) or
    (list <> 'personal' and member_id is null)
  )
);

create index if not exists checklist_items_trip_id_idx on checklist_items (trip_id);
create index if not exists checklist_items_member_id_idx on checklist_items (member_id);

-- ---------------------------------------------------------------------
-- Grocery items: manually-added items that aren't tied to a meal, plus
-- per-item overrides (quantity/category/assignment/purchased/packed) for
-- items that were auto-generated from meal ingredients. `source_key` holds
-- the normalised "name|unit" key used to match against combined ingredient
-- lines when `ingredient_id` is null.
-- ---------------------------------------------------------------------
create table if not exists grocery_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  source_key text, -- set when this row is an override of a combined ingredient line
  name text not null,
  quantity numeric not null default 1,
  unit text not null default '',
  category text not null default 'Other',
  assigned_member_id uuid references members (id) on delete set null,
  purchased boolean not null default false,
  packed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists grocery_items_trip_id_idx on grocery_items (trip_id);

-- =====================================================
-- Row Level Security
-- =====================================================
-- IMPORTANT: enable RLS and add policies before using this in production.
-- With RLS off (the default above), any client holding the anon key can
-- read and write every row in every table. A simple starting point once
-- you have an auth strategy (e.g. Supabase Auth, or a shared trip-level
-- secret) is to scope all access to rows whose trip_id/invite_code matches
-- the trip the caller has proven access to. Example:
--
--   alter table trips enable row level security;
--   alter table members enable row level security;
--   alter table meals enable row level security;
--   alter table ingredients enable row level security;
--   alter table checklist_items enable row level security;
--   alter table grocery_items enable row level security;
--
--   -- then add policies appropriate to your auth model, e.g.:
--   create policy "trip members can read" on trips
--     for select using (true); -- replace `true` with a real check
