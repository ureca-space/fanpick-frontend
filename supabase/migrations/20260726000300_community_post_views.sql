alter table public.community_posts
  add column if not exists view_count integer not null default 0;

update public.community_posts
set view_count = 0
where view_count is null;

alter table public.community_posts
  alter column view_count set default 0;

alter table public.community_posts
  alter column view_count set not null;

create or replace function public.record_community_post_view(
  target_post_id bigint
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_view_count integer;
begin
  update public.community_posts
  set view_count = coalesce(view_count, 0) + 1
  where id = target_post_id
  returning view_count into next_view_count;

  return next_view_count;
end;
$$;

grant execute on function public.record_community_post_view(bigint)
  to anon, authenticated;
