import { getTeamInfo as getSharedTeamInfo } from "../../constants/teamInfo";
import { supabase } from "../../lib/supabase";
import { hasResolvedPredictionScore } from "../../services/predictionApi";
import {
  normalizeMatchTimingStatus,
  parseMatchScore,
} from "../../utils/matchStatus";
import { createMatchBeginAt } from "../../utils/predictionDeadline";

export const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export const FILTERS = [
  { id: "all", label: "ALL" },
  { id: "soccer", label: "SOCCER" },
  { id: "baseball", label: "BASEBALL" },
  { id: "esports", label: "LOL" },
];

export const PREDICTION_SPORTS = FILTERS.filter(
  (filter) => filter.id !== "all",
).map((filter) => filter.id);

const padNumber = (number) => String(number).padStart(2, "0");

export const createToday = () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return today;
};

export const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());

  return `${year}-${month}-${day}`;
};

export const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day, 12);
};

export const addDays = (date, amount) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

export const getMonday = (date) => {
  const currentDate = new Date(date);
  const currentDay = currentDate.getDay();
  const difference = currentDay === 0 ? -6 : 1 - currentDay;

  currentDate.setDate(currentDate.getDate() + difference);
  currentDate.setHours(12, 0, 0, 0);
  return currentDate;
};

const getPredictionTeamInfo = (teamCode, sport) => {
  const code = String(teamCode ?? "").trim().toUpperCase();
  const team = getSharedTeamInfo(teamCode, sport);

  return {
    id: code,
    name: team?.name ?? teamCode ?? "미정",
    shortName: (team?.shortName ?? code) || "-",
    logo: team?.logo ?? "",
  };
};

const normalizeSupabaseMatch = (match) => {
  const sport = match.sport;
  const time = match.match_time?.slice(0, 5) ?? "--:--";
  const timingStatus = normalizeMatchTimingStatus({
    matchDate: match.match_date,
    matchTime: time,
    score: match.score,
    sport,
    status: match.status,
  });
  const { homeScore, awayScore } = parseMatchScore(timingStatus.score);
  const normalizedMatch = {
    ...match,
    score: timingStatus.score,
    status: timingStatus.status,
  };

  return {
    id: `match-${match.id}`,
    databaseId: match.id,
    dateKey: match.match_date,
    beginAt: createMatchBeginAt(
      match.match_date,
      time === "--:--" ? "00:00" : time,
    ),
    sport,
    sportLabel:
      sport === "esports" ? "LOL" : sport === "soccer" ? "SOCCER" : "BASEBALL",
    league: match.league,
    time,
    status: timingStatus.status,
    score: timingStatus.score,
    participants: 0,
    homeRate: 50,
    homeTeam: getPredictionTeamInfo(match.home_team_code, sport),
    awayTeam: getPredictionTeamInfo(match.away_team_code, sport),
    homeScore,
    awayScore,
    isFinished:
      timingStatus.status === "finished" ||
      hasResolvedPredictionScore(normalizedMatch),
  };
};

export const fetchPredictionMatches = async (startDate, endDate) => {
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
        id,
        sport,
        league,
        match_date,
        match_time,
        away_team_code,
        home_team_code,
        score,
        status
      `,
    )
    .in("sport", ["baseball", "esports", "soccer"])
    .gte("match_date", startDate)
    .lte("match_date", endDate)
    .order("match_date", { ascending: true })
    .order("match_time", { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .filter(
      (match) =>
        match.match_date &&
        match.home_team_code &&
        match.away_team_code,
    )
    .map(normalizeSupabaseMatch);
};
