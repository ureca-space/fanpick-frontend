alter table public.community_posts
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists image_paths text[] not null default '{}';

update public.community_posts
set
  image_urls = case
    when image_url is not null and image_urls = '{}'::text[] then array[image_url]
    else image_urls
  end,
  image_paths = case
    when image_path is not null and image_paths = '{}'::text[] then array[image_path]
    else image_paths
  end;
