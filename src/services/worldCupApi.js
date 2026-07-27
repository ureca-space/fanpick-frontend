import { supabase } from "../lib/supabase";

const RESULTS_TABLE = "worldcup_results";

export const saveWorldCupResult = async ({
  userId,
  worldCupId,
  championCandidateId,
}) => {
  if (!userId || !worldCupId || !championCandidateId) {
    return;
  }

  const { data, error } = await supabase
    .from(RESULTS_TABLE)
    .upsert(
      {
        user_id: userId,
        worldcup_id: worldCupId,
        champion_candidate_id: championCandidateId,
        selected_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,worldcup_id",
      },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const getWorldCupResultStats = async (worldCupId) => {
  const { data, error } = await supabase.rpc("get_worldcup_result_stats", {
    target_worldcup_id: worldCupId,
  });

  if (error) {
    throw error;
  }

  return data;
};
