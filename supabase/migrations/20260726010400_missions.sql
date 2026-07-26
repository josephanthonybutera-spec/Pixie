-- missions: the high-stakes reservations Pixie hunts for a trip
-- (e.g. Cinderella's Royal Table, Oga's Cantina, Lightning Lane windows).
-- mission_key is the engine's stable id ('crt', 'oga', 'llday1').
-- "window" is quoted because it is a reserved word in PostgreSQL.

create type public.mission_status as enum ('staged', 'attempting', 'hunting', 'secured');

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  mission_key text not null,
  name text not null,
  why text,
  status public.mission_status not null default 'staged',
  "window" text,
  window_days int,
  staged text,
  backups text[] not null default '{}',
  secured_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, mission_key)
);

create index missions_user_idx on public.missions (user_id);
create index missions_trip_idx on public.missions (trip_id);

create trigger missions_set_updated_at
  before update on public.missions
  for each row execute function public.set_updated_at();

alter table public.missions enable row level security;

create policy "missions_select_own" on public.missions
  for select using (auth.uid() = user_id);
create policy "missions_insert_own" on public.missions
  for insert with check (auth.uid() = user_id);
create policy "missions_update_own" on public.missions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "missions_delete_own" on public.missions
  for delete using (auth.uid() = user_id);
