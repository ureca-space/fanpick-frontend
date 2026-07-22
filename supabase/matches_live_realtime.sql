do $$
declare
  status_constraint_name text;
begin
  select constraint_name
  into status_constraint_name
  from information_schema.check_constraints
  join information_schema.constraint_column_usage using (
    constraint_catalog,
    constraint_schema,
    constraint_name
  )
  where constraint_schema = 'public'
    and table_schema = 'public'
    and table_name = 'matches'
    and column_name = 'status'
    and check_clause ilike '%status%'
    and check_clause ilike '%scheduled%'
    and check_clause ilike '%finished%'
  limit 1;

  if status_constraint_name is not null then
    execute format(
      'alter table public.matches drop constraint if exists %I',
      status_constraint_name
    );
  end if;
end $$;

alter table public.matches
  add constraint matches_status_check
  check (status in ('scheduled', 'live', 'finished', 'cancelled', 'postponed'));

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  )
  and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
end $$;
