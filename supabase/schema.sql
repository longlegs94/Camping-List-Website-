create table if not exists public.camplist_plans (
  code text primary key check (code ~ '^[A-Z0-9]{10}$'),
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.camplist_plans enable row level security;

revoke all on table public.camplist_plans from anon, authenticated;
grant select, insert, update on table public.camplist_plans to anon, authenticated;

create policy "Link holders can read a CampList plan"
on public.camplist_plans
for select
to anon, authenticated
using (
  code = (
    nullif((select current_setting('request.headers', true)), '')::jsonb
    ->> 'x-camplist-code'
  )
);

create policy "Link holders can create a CampList plan"
on public.camplist_plans
for insert
to anon, authenticated
with check (
  code = (
    nullif((select current_setting('request.headers', true)), '')::jsonb
    ->> 'x-camplist-code'
  )
);

create policy "Link holders can update a CampList plan"
on public.camplist_plans
for update
to anon, authenticated
using (
  code = (
    nullif((select current_setting('request.headers', true)), '')::jsonb
    ->> 'x-camplist-code'
  )
)
with check (
  code = (
    nullif((select current_setting('request.headers', true)), '')::jsonb
    ->> 'x-camplist-code'
  )
);
