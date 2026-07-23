grant usage on schema public to service_role;
grant select on table public.matches to service_role;
grant select, update on table public.predictions to service_role;

notify pgrst, 'reload schema';
