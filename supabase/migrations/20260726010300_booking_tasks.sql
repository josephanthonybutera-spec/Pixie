-- booking_tasks: the state machine from the prototype. Missions move
-- staged -> attempting -> hunting -> secured; vault reservations move
-- pending -> confirmed (with a confirmation code). 'failed' is the
-- terminal error state.

create type public.booking_task_status as enum (
  'pending',
  'staged',
  'attempting',
  'hunting',
  'secured',
  'confirmed',
  'failed'
);

create table public.booking_tasks (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('room', 'tickets', 'dining', 'lightning_lane', 'other')),
  name text not null,
  status public.booking_task_status not null default 'pending',
  confirmation_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index booking_tasks_user_idx on public.booking_tasks (user_id);
create index booking_tasks_trip_idx on public.booking_tasks (trip_id);

create trigger booking_tasks_set_updated_at
  before update on public.booking_tasks
  for each row execute function public.set_updated_at();

alter table public.booking_tasks enable row level security;

create policy "booking_tasks_select_own" on public.booking_tasks
  for select using (auth.uid() = user_id);
create policy "booking_tasks_insert_own" on public.booking_tasks
  for insert with check (auth.uid() = user_id);
create policy "booking_tasks_update_own" on public.booking_tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "booking_tasks_delete_own" on public.booking_tasks
  for delete using (auth.uid() = user_id);
