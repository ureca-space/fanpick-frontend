create table if not exists public.team_standings (
  id uuid primary key default gen_random_uuid(),
  league_id text not null,
  league_name text not null,
  season integer not null,
  team_id text,
  team_code text not null,
  team_name text not null,
  rank integer not null,
  games integer not null default 0,
  wins integer not null default 0,
  draws integer not null default 0,
  losses integer not null default 0,
  points integer,
  win_rate numeric(6, 3),
  kda numeric(6, 2),
  kills integer,
  deaths integer,
  assists integer,
  score_for integer,
  score_against integer,
  score_diff integer,
  games_behind text,
  streak text,
  recent text,
  source text not null,
  source_url text not null,
  updated_at timestamptz not null default now(),
  constraint team_standings_league_season_team_unique
    unique (league_id, season, team_code)
);

alter table public.team_standings
  add column if not exists kda numeric(6, 2),
  add column if not exists kills integer,
  add column if not exists deaths integer,
  add column if not exists assists integer;

alter table public.team_standings enable row level security;

drop policy if exists "Anyone can read team standings"
  on public.team_standings;

create policy "Anyone can read team standings"
  on public.team_standings
  for select
  to anon, authenticated
  using (true);

grant select on table public.team_standings to anon, authenticated;
grant all privileges on table public.team_standings to service_role;

create index if not exists team_standings_league_rank_idx
  on public.team_standings (league_id, season, rank);

notify pgrst, 'reload schema';
