-- itineraries: one row per park day of a trip; itinerary_items: the ordered
-- plan entries within a day. user_id is denormalized onto both tables so RLS
-- keys directly to auth.uid() with no joins.

create table public.itineraries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  day_index int not null check (day_index >= 0),
  park text not null check (park in ('MK', 'EP', 'HS', 'AK')),
  park_name text not null,
  storm boolean not null default false,
  -- Lightning Lane plan for the day: {"mp": [names], "sp": name | null}
  ll jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (trip_id, day_index)
);

create index itineraries_user_idx on public.itineraries (user_id);
create index itineraries_trip_idx on public.itineraries (trip_id);

alter table public.itineraries enable row level security;

create policy "itineraries_select_own" on public.itineraries
  for select using (auth.uid() = user_id);
create policy "itineraries_insert_own" on public.itineraries
  for insert with check (auth.uid() = user_id);
create policy "itineraries_update_own" on public.itineraries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "itineraries_delete_own" on public.itineraries
  for delete using (auth.uid() = user_id);

create table public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  position int not null check (position >= 0),
  type text not null check (type in ('tip', 'ride', 'meal', 'break', 'show', 'char', 'night')),
  -- minutes since midnight, matching the engine's time representation
  time_min int not null,
  name text not null,
  land text not null default '',
  dur_min int not null default 0,
  indoor boolean,
  note text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (itinerary_id, position)
);

create index itinerary_items_user_idx on public.itinerary_items (user_id);
create index itinerary_items_itinerary_idx on public.itinerary_items (itinerary_id);

alter table public.itinerary_items enable row level security;

create policy "itinerary_items_select_own" on public.itinerary_items
  for select using (auth.uid() = user_id);
create policy "itinerary_items_insert_own" on public.itinerary_items
  for insert with check (auth.uid() = user_id);
create policy "itinerary_items_update_own" on public.itinerary_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "itinerary_items_delete_own" on public.itinerary_items
  for delete using (auth.uid() = user_id);
