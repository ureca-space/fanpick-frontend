create table if not exists public.team_records (
  id uuid primary key default gen_random_uuid(),
  sport_id text not null,
  league_id text not null,
  league_name text not null,
  season integer not null,
  record_key text not null,
  team_id text,
  team_code text,
  team_name text not null,
  team_short_name text,
  rank integer not null,
  logo_url text,
  stats jsonb not null default '{}'::jsonb,
  source text not null default 'UNKNOWN',
  source_url text not null default '',
  updated_at timestamptz not null default now(),
  constraint team_records_unique
    unique (sport_id, league_id, season, record_key)
);

create table if not exists public.player_records (
  id uuid primary key default gen_random_uuid(),
  sport_id text not null,
  league_id text not null,
  league_name text not null,
  season integer not null,
  record_key text not null,
  player_id text,
  player_name text not null,
  player_full_name text,
  team_id text,
  team_code text,
  team_name text,
  team_short_name text,
  position text,
  rank integer not null,
  image_url text,
  stats jsonb not null default '{}'::jsonb,
  source text not null default 'UNKNOWN',
  source_url text not null default '',
  updated_at timestamptz not null default now(),
  constraint player_records_unique
    unique (sport_id, league_id, season, record_key)
);

alter table public.team_records
  add column if not exists sport_id text,
  add column if not exists league_id text,
  add column if not exists league_name text,
  add column if not exists season integer,
  add column if not exists record_key text,
  add column if not exists team_id text,
  add column if not exists team_code text,
  add column if not exists team_name text,
  add column if not exists team_short_name text,
  add column if not exists rank integer,
  add column if not exists logo_url text,
  add column if not exists stats jsonb not null default '{}'::jsonb,
  add column if not exists source text not null default 'UNKNOWN',
  add column if not exists source_url text not null default '',
  add column if not exists updated_at timestamptz not null default now();

alter table public.player_records
  add column if not exists sport_id text,
  add column if not exists league_id text,
  add column if not exists league_name text,
  add column if not exists season integer,
  add column if not exists record_key text,
  add column if not exists player_id text,
  add column if not exists player_name text,
  add column if not exists player_full_name text,
  add column if not exists team_id text,
  add column if not exists team_code text,
  add column if not exists team_name text,
  add column if not exists team_short_name text,
  add column if not exists position text,
  add column if not exists rank integer,
  add column if not exists image_url text,
  add column if not exists stats jsonb not null default '{}'::jsonb,
  add column if not exists source text not null default 'UNKNOWN',
  add column if not exists source_url text not null default '',
  add column if not exists updated_at timestamptz not null default now();

alter table public.team_records enable row level security;
alter table public.player_records enable row level security;

drop policy if exists "Anyone can read team records"
  on public.team_records;

create policy "Anyone can read team records"
  on public.team_records
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can read player records"
  on public.player_records;

create policy "Anyone can read player records"
  on public.player_records
  for select
  to anon, authenticated
  using (true);

grant select on table public.team_records to anon, authenticated;
grant select on table public.player_records to anon, authenticated;
grant all privileges on table public.team_records to service_role;
grant all privileges on table public.player_records to service_role;

create index if not exists team_records_lookup_idx
  on public.team_records (sport_id, league_id, season, rank);

create index if not exists player_records_lookup_idx
  on public.player_records (sport_id, league_id, season, rank);

do $$
begin
  alter publication supabase_realtime add table public.team_records;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.player_records;
exception
  when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
