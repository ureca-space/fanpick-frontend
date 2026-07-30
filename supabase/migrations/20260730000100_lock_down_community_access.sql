-- Lock down community data so authenticated users can only mutate their own rows.
-- Public read access is intentionally kept for the community board.

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_post_reactions enable row level security;
alter table public.community_comment_reactions enable row level security;

revoke insert, update, delete on public.community_posts from anon;
revoke insert, update, delete on public.community_comments from anon;
revoke insert, update, delete on public.community_post_reactions from anon;
revoke insert, update, delete on public.community_comment_reactions from anon;

grant select on public.community_posts to anon, authenticated;
grant select on public.community_comments to anon, authenticated;
grant select on public.community_post_reactions to anon, authenticated;
grant select on public.community_comment_reactions to anon, authenticated;

grant insert, update, delete on public.community_posts to authenticated;
grant insert, update, delete on public.community_comments to authenticated;
grant insert, update, delete on public.community_post_reactions to authenticated;
grant insert, update, delete on public.community_comment_reactions to authenticated;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'community_posts',
        'community_comments',
        'community_post_reactions',
        'community_comment_reactions'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

create policy "Anyone can read community posts"
  on public.community_posts
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can create community posts"
  on public.community_posts
  for insert
  to authenticated
  with check ((select auth.uid())::text = user_id::text);

create policy "Users can update own community posts"
  on public.community_posts
  for update
  to authenticated
  using ((select auth.uid())::text = user_id::text)
  with check ((select auth.uid())::text = user_id::text);

create policy "Users can delete own community posts"
  on public.community_posts
  for delete
  to authenticated
  using ((select auth.uid())::text = user_id::text);

create policy "Anyone can read community comments"
  on public.community_comments
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can create community comments"
  on public.community_comments
  for insert
  to authenticated
  with check ((select auth.uid())::text = user_id::text);

create policy "Users can update own community comments"
  on public.community_comments
  for update
  to authenticated
  using ((select auth.uid())::text = user_id::text)
  with check ((select auth.uid())::text = user_id::text);

create policy "Users can delete own community comments"
  on public.community_comments
  for delete
  to authenticated
  using ((select auth.uid())::text = user_id::text);

create policy "Anyone can read community post reactions"
  on public.community_post_reactions
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can create own community post reactions"
  on public.community_post_reactions
  for insert
  to authenticated
  with check ((select auth.uid())::text = user_id::text);

create policy "Users can update own community post reactions"
  on public.community_post_reactions
  for update
  to authenticated
  using ((select auth.uid())::text = user_id::text)
  with check ((select auth.uid())::text = user_id::text);

create policy "Users can delete own community post reactions"
  on public.community_post_reactions
  for delete
  to authenticated
  using ((select auth.uid())::text = user_id::text);

create policy "Anyone can read community comment reactions"
  on public.community_comment_reactions
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can create own community comment reactions"
  on public.community_comment_reactions
  for insert
  to authenticated
  with check ((select auth.uid())::text = user_id::text);

create policy "Users can update own community comment reactions"
  on public.community_comment_reactions
  for update
  to authenticated
  using ((select auth.uid())::text = user_id::text)
  with check ((select auth.uid())::text = user_id::text);

create policy "Users can delete own community comment reactions"
  on public.community_comment_reactions
  for delete
  to authenticated
  using ((select auth.uid())::text = user_id::text);

-- The app stores files under "<auth.uid()>/<file>" for both buckets.
-- Remove broad storage policies that could let one user mutate another user's files.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        policyname ilike '%community%'
        or policyname ilike '%avatar%'
        or coalesce(qual, '') ilike '%community-images%'
        or coalesce(with_check, '') ilike '%community-images%'
        or coalesce(qual, '') ilike '%avatars%'
        or coalesce(with_check, '') ilike '%avatars%'
        or (
          cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
          and coalesce(qual, '') !~* '(bucket_id|owner|foldername|name)'
          and coalesce(with_check, '') !~* '(bucket_id|owner|foldername|name)'
        )
        or (
          cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
          and (
            (
              cmd = 'INSERT'
              and coalesce(nullif(trim(with_check), ''), 'true') in ('true', '(true)')
            )
            or (
              cmd = 'DELETE'
              and coalesce(nullif(trim(qual), ''), 'true') in ('true', '(true)')
            )
            or (
              cmd in ('ALL', 'UPDATE')
              and (
                coalesce(nullif(trim(qual), ''), 'true') in ('true', '(true)')
                or coalesce(nullif(trim(with_check), ''), 'true') in ('true', '(true)')
              )
            )
          )
        )
      )
  loop
    execute format(
      'drop policy if exists %I on storage.objects',
      policy_record.policyname
    );
  end loop;
end $$;

create policy "Community images are publicly readable"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'community-images');

create policy "Users can upload own community images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'community-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update own community images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'community-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'community-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete own community images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'community-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Avatars are publicly readable"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "Users can upload own avatars"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update own avatars"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete own avatars"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
