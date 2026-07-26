import { supabase } from "../lib/supabase";

const DEFAULT_RANKING_LIMIT = 50;

export const fetchCommunityPredictionRanking = async (
  limit = DEFAULT_RANKING_LIMIT,
) => {
  const { data, error } = await supabase.rpc(
    "get_community_prediction_ranking",
    {
      limit_count: limit,
    },
  );

  if (error) throw error;

  return data ?? [];
};
