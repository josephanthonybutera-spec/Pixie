-- trips: one row per generated trip plan. `party` holds the family shape
-- (adults, kid ages, characters/starwars flags, must-dos, skyliner,
-- assumptions); the engine re-derives all pricing from these inputs.

create type public.trip_status as enum ('draft', 'booked', 'archived');

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  party jsonb not null default '{}'::jsonb,
  park_days int not null default 4 check (park_days between 1 and 6),
  month text,
  budget int,
  pace text check (pace in ('relaxed', 'balanced', 'commando')),
  dining text check (dining in ('table', 'quick', 'mix')),
  priorities text[] not null default '{}',
  resort text,
  status public.trip_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trips_user_created_idx on public.trips (user_id, created_at desc);

create trigger trips_set_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

alter table public.trips enable row level security;

create policy "trips_select_own" on public.trips
  for select using (auth.uid() = user_id);
create policy "trips_insert_own" on public.trips
  for insert with check (auth.uid() = user_id);
create policy "trips_update_own" on public.trips
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trips_delete_own" on public.trips
  for delete using (auth.uid() = user_id);
