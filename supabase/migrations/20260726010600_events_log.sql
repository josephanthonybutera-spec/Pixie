-- events_log: append-only product analytics. Users can insert and read
-- their own events; there are deliberately no update/delete policies, so
-- RLS denies mutation of history even to the row owner.

create table public.events_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index events_log_user_created_idx on public.events_log (user_id, created_at desc);

alter table public.events_log enable row level security;

create policy "events_log_select_own" on public.events_log
  for select using (auth.uid() = user_id);
create policy "events_log_insert_own" on public.events_log
  for insert with check (auth.uid() = user_id);
