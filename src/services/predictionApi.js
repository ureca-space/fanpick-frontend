import { supabase } from "../lib/supabase";

// - 로그인한 사용자의 종목별 예측 통계 조회
export const fetchMyPredictionStats = async () => {
  const { data, error } = await supabase.rpc("get_my_prediction_stats");

  if (error) throw error;

  return data ?? [];
};

// - 경기별 참여자 수와 홈/원정 투표 비율 조회
export const fetchMatchPredictionStats = async () => {
  const { data, error } = await supabase.rpc("get_match_prediction_stats");

  if (error) throw error;

  return data ?? [];
};
