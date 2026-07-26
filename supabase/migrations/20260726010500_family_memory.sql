-- family_memory: the companion's long-term memory of a family — facts as
-- [{"k","v","src"}] and learned behaviors as ["..."]. One row per user.

create table public.family_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  facts jsonb not null default '[]'::jsonb,
  behaviors jsonb not null default '[]'::jsonb,
  trips_planned int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger family_memory_set_updated_at
  before update on public.family_memory
  for each row execute function public.set_updated_at();

alter table public.family_memory enable row level security;

create policy "family_memory_select_own" on public.family_memory
  for select using (auth.uid() = user_id);
create policy "family_memory_insert_own" on public.family_memory
  for insert with check (auth.uid() = user_id);
create policy "family_memory_update_own" on public.family_memory
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "family_memory_delete_own" on public.family_memory
  for delete using (auth.uid() = user_id);
