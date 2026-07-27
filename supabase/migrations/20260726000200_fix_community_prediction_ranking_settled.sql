drop function if exists public.get_community_prediction_ranking(integer);

create or replace function public.get_community_prediction_ranking(
  limit_count integer default 50
)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  total_count bigint,
  correct_count bigint,
  incorrect_count bigint,
  accuracy_rate numeric,
  ranking_score numeric,
  rank bigint
)
language sql
security definer
set search_path = public, auth
as $$
  with match_context as (
    select
      p.user_id,
      p.selected_team_code,
      p.result,
      m.away_team_code,
      m.home_team_code,
      m.score,
      lower(coalesce(m.status, '')) as status_key,
      case
        when m.match_date is null then null
        else (
          (
            m.match_date::text
            || ' '
            || coalesce(nullif(left(m.match_time::text, 5), ''), '23:59')
          )::timestamp at time zone 'Asia/Seoul'
        )
      end as match_starts_at,
      case
        when lower(coalesce(m.sport, '')) = 'baseball' then interval '180 minutes'
        when lower(coalesce(m.sport, '')) = 'soccer' then interval '110 minutes'
        when lower(coalesce(m.sport, '')) in ('esports', 'lol', 'lck')
          then interval '90 minutes'
        else interval '120 minutes'
      end as finished_protection_window
    from public.predictions p
    left join public.matches m
      on m.id = p.match_id
    where p.user_id is not null
  ),
  prediction_results as (
    select
      user_id,
      case
        when status_key in ('finished', 'complete', 'completed', 'ended', 'final')
          and (
            match_starts_at is null
            or now() >= match_starts_at + finished_protection_window
          )
          and score ~ '^[0-9]+:[0-9]+$'
          and split_part(score, ':', 1)::integer
            <> split_part(score, ':', 2)::integer
          then
            case
              when upper(coalesce(selected_team_code, '')) =
                case
                  when split_part(score, ':', 2)::integer
                    > split_part(score, ':', 1)::integer
                    then upper(coalesce(home_team_code, ''))
                  else upper(coalesce(away_team_code, ''))
                end
                then 'correct'
              else 'incorrect'
            end
        when status_key in ('finished', 'complete', 'completed', 'ended', 'final')
          and (
            match_starts_at is null
            or now() >= match_starts_at + finished_protection_window
          )
          and result in ('correct', 'incorrect')
          then result
        else null
      end as settled_result
    from match_context
  ),
  summary as (
    select
      user_id,
      count(*) filter (where settled_result = 'correct') as correct_count,
      count(*) filter (where settled_result = 'incorrect') as incorrect_count
    from prediction_results
    where settled_result in ('correct', 'incorrect')
    group by user_id
  ),
  scored as (
    select
      s.user_id,
      s.correct_count + s.incorrect_count as total_count,
      s.correct_count,
      s.incorrect_count,
      round(
        (s.correct_count::numeric / nullif(s.correct_count + s.incorrect_count, 0)) * 100
      ) as accuracy_rate,
      round(
        (
          (
            (s.correct_count::numeric / nullif(s.correct_count + s.incorrect_count, 0))
            + (1.96 * 1.96) / (2 * (s.correct_count + s.incorrect_count))
            - 1.96 * sqrt(
              (
                (
                  (s.correct_count::numeric / nullif(s.correct_count + s.incorrect_count, 0))
                  * (1 - (s.correct_count::numeric / nullif(s.correct_count + s.incorrect_count, 0)))
                )
                + (1.96 * 1.96) / (4 * (s.correct_count + s.incorrect_count))
              )
              / (s.correct_count + s.incorrect_count)
            )
          )
          / (1 + (1.96 * 1.96) / (s.correct_count + s.incorrect_count))
        )
        * least(1::numeric, (s.correct_count + s.incorrect_count)::numeric / 20)
        * 100,
        1
      ) as ranking_score
    from summary s
    where s.correct_count + s.incorrect_count > 0
  ),
  ranked as (
    select
      sc.user_id,
      coalesce(
        nullif(u.raw_user_meta_data ->> 'nickname', ''),
        nullif(u.raw_user_meta_data ->> 'name', ''),
        nullif(split_part(u.email, '@', 1), ''),
        'FanPick 사용자'
      ) as display_name,
      nullif(u.raw_user_meta_data ->> 'avatar_url', '') as avatar_url,
      sc.total_count,
      sc.correct_count,
      sc.incorrect_count,
      sc.accuracy_rate,
      sc.ranking_score
    from scored sc
    inner join auth.users u
      on u.id = sc.user_id
  ),
  ranked_with_position as (
    select
      ranked.*,
      dense_rank() over (
        order by
          ranking_score desc,
          accuracy_rate desc,
          total_count desc,
          correct_count desc,
          display_name asc
      ) as rank_position
    from ranked
  )
  select
    ranked_with_position.user_id,
    ranked_with_position.display_name,
    ranked_with_position.avatar_url,
    ranked_with_position.total_count,
    ranked_with_position.correct_count,
    ranked_with_position.incorrect_count,
    ranked_with_position.accuracy_rate,
    ranked_with_position.ranking_score,
    ranked_with_position.rank_position as rank
  from ranked_with_position
  order by
    ranked_with_position.rank_position asc,
    ranked_with_position.ranking_score desc,
    ranked_with_position.accuracy_rate desc,
    ranked_with_position.total_count desc,
    ranked_with_position.correct_count desc,
    ranked_with_position.display_name asc
  limit greatest(1, least(coalesce(limit_count, 50), 100));
$$;

grant execute on function public.get_community_prediction_ranking(integer)
  to anon, authenticated;
