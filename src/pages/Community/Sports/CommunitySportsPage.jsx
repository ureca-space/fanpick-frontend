import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../../components/EmptyState/EmptyState";
import MatchFilter from "../../../components/MatchFilter/MatchFilter";
import PredictionResultMatchCard from "../../../components/PredictionResultMatchCard/PredictionResultMatchCard";
import Skeleton from "../../../components/Skeleton/Skeleton";
import StandingsTable from "../../../components/StandingsTable/StandingsTable";
import { getTeamInfo } from "../../../constants/teamInfo";
import useAuth from "../../../contexts/useAuth";
import { supabase } from "../../../lib/supabase";
import {
  applyPredictionStatsToMatches,
  fetchMatchPredictionStats,
  fetchMyPredictionSelections,
  hasResolvedPredictionScore,
  markPredictedMatches,
} from "../../../services/predictionApi";
import { fetchTeamStandings } from "../../../services/teamStandings";
import { normalizeMatchTimingStatus } from "../../../utils/matchStatus";
import CommunitySubNav from "../components/CommunitySubNav/CommunitySubNav";
import styles from "./CommunitySportsPage.module.css";

const LEAGUES = [
  {
    id: "kbo",
    sport: "baseball",
    sportLabel: "BASEBALL",
    label: "KBO",
  },
  {
    id: "kleague",
    sport: "soccer",
    sportLabel: "SOCCER",
    label: "K LEAGUE",
  },
  {
    id: "lck",
    sport: "esports",
    sportLabel: "LOL",
    label: "LCK",
  },
];

const LEAGUE_FILTERS = [
  {
    id: "all",
    label: "ALL",
  },
  ...LEAGUES.map((league) => ({
    id: league.id,
    label: league.label,
  })),
];

const PAGE_META = {
  standings: {
    eyebrow: "LEAGUE STANDINGS",
    title: "순위",
    sectionTitle: "리그 순위",
    emptyTitle: "순위 데이터가 없습니다.",
  },
  results: {
    eyebrow: "MATCH RESULTS",
    title: "경기 결과",
    sectionTitle: "최근 경기 결과",
    emptyTitle: "경기 결과가 없습니다.",
  },
  "prediction-results": {
    eyebrow: "PREDICTION RESULTS",
    title: "승부 예측 결과",
    sectionTitle: "승부 예측 결과",
    emptyTitle: "승부 예측 결과가 없습니다.",
  },
};

const SPORT_BY_ID = Object.fromEntries(LEAGUES.map((league) => [league.id, league]));
const LEAGUE_ID_BY_SPORT = Object.fromEntries(
  LEAGUES.map((league) => [league.sport, league.id]),
);
const MATCH_RESULT_LIMIT = 8;
const STANDING_SKELETON_ROWS = {
  kbo: 10,
  kleague: 12,
  lck: 10,
};
const padNumber = (number) => String(number).padStart(2, "0");

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());

  return `${year}-${month}-${day}`;
};

const addDays = (date, amount) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

const formatShortDate = (dateKey) => {
  if (!dateKey) return "--.--";

  const [, month, day] = String(dateKey).split("-");

  return `${month}.${day}`;
};

const parseScore = (score) => {
  if (!score) {
    return {
      awayScore: null,
      homeScore: null,
    };
  }

  const [awayScore, homeScore] = String(score).split(":").map(Number);

  return {
    awayScore: Number.isFinite(awayScore) ? awayScore : null,
    homeScore: Number.isFinite(homeScore) ? homeScore : null,
  };
};

const getDisplayTeam = (teamCode, sport) => {
  const code = teamCode?.trim().toUpperCase() ?? "";
  const team = getTeamInfo(code, sport);

  return {
    code,
    name: team.name,
    logo: team.logo,
    shortName: team.shortName,
  };
};

const normalizeMatch = (match) => {
  const leagueId = LEAGUE_ID_BY_SPORT[match.sport] ?? "kbo";
  const league = SPORT_BY_ID[leagueId];
  const time = match.match_time?.slice(0, 5) ?? "--:--";
  const timingStatus = normalizeMatchTimingStatus({
    matchDate: match.match_date,
    matchTime: time,
    score: match.score,
    sport: match.sport,
    status: match.status,
  });
  const { awayScore, homeScore } = parseScore(timingStatus.score);

  return {
    id: match.id,
    databaseId: match.id,
    leagueId,
    leagueLabel: league?.label ?? match.league,
    sport: match.sport,
    sportLabel: league?.sportLabel ?? match.sport?.toUpperCase(),
    match_date: match.match_date,
    match_time: match.match_time,
    dateKey: match.match_date,
    dateLabel: formatShortDate(match.match_date),
    time,
    status: timingStatus.status,
    score: timingStatus.score,
    awayScore,
    homeScore,
    awayTeam: getDisplayTeam(match.away_team_code, match.sport),
    homeTeam: getDisplayTeam(match.home_team_code, match.sport),
    participants: 0,
    awayVotes: 50,
    homeVotes: 50,
  };
};

const isResultMatch = (match) =>
  !["cancelled", "postponed"].includes(match.status) &&
  hasResolvedPredictionScore(match);

const groupByLeague = (items, leagues = LEAGUES) =>
  leagues.map((league) => ({
    ...league,
    items: items.filter((item) => item.leagueId === league.id),
  }));

const fetchRecentResultMatches = async () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const startDate = formatDateKey(addDays(today, -120));
  const endDate = formatDateKey(today);

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
    .in("sport", LEAGUES.map((league) => league.sport))
    .gte("match_date", startDate)
    .lte("match_date", endDate)
    .order("match_date", { ascending: false })
    .order("match_time", { ascending: false })
    .limit(240);

  if (error) throw error;

  return (data ?? [])
    .filter((match) => match.match_date && match.away_team_code && match.home_team_code)
    .map(normalizeMatch)
    .filter(isResultMatch);
};

const SportsPageSkeleton = ({ leagues, view }) => (
  <div className={styles.sections}>
    {leagues.map((league) => (
      <section className={styles.sectionCard} key={league.id}>
        <div className={styles.sectionHeader}>
          <Skeleton.Line className={styles.skeletonEyebrow} />
          <Skeleton.Line className={styles.skeletonTitle} />
        </div>

        {view === "standings" ? (
          <div className={styles.standingsSkeleton}>
            {Array.from(
              { length: STANDING_SKELETON_ROWS[league.id] ?? 10 },
              (_, index) => (
                <Skeleton.Line key={index} className={styles.skeletonRow} />
              ),
            )}
          </div>
        ) : (
          <div className={styles.matchGrid}>
            {Array.from({ length: MATCH_RESULT_LIMIT }, (_, index) => (
              <Skeleton.Box key={index} className={styles.skeletonMatchCard} />
            ))}
          </div>
        )}
      </section>
    ))}
  </div>
);

const LeagueSection = ({ children, description, league, title }) => (
  <section className={styles.sectionCard}>
    <div className={styles.sectionHeader}>
      <div>
        <p className={styles.sectionEyebrow}>
          {league.sportLabel} · {league.label}
        </p>
        <h2>{title}</h2>
      </div>
      {description && <span>{description}</span>}
    </div>
    {children}
  </section>
);

const CommunitySportsPage = ({ view = "standings" }) => {
  const { user } = useAuth();
  const pageMeta = PAGE_META[view] ?? PAGE_META.standings;
  const [activeLeagueId, setActiveLeagueId] = useState("all");
  const [standingsByLeague, setStandingsByLeague] = useState({});
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSportsData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        if (view === "standings") {
          const standingsEntries = await Promise.all(
            LEAGUES.map(async (league) => [
              league.id,
              await fetchTeamStandings(league.id),
            ]),
          );

          if (isMounted) {
            setStandingsByLeague(Object.fromEntries(standingsEntries));
            setMatches([]);
          }
          return;
        }

        const recentMatches = await fetchRecentResultMatches();

        if (view === "prediction-results") {
          const predictionStats = await fetchMatchPredictionStats();
          const matchesWithStats = applyPredictionStatsToMatches(
            recentMatches,
            predictionStats,
          ).filter((match) => match.participants > 0);
          const myPredictions = user?.id
            ? await fetchMyPredictionSelections(
                user.id,
                matchesWithStats.map((match) => match.databaseId),
              ).catch((error) => {
                console.error("커뮤니티 예측 결과 내 선택 조회 실패", error);
                return [];
              })
            : [];

          if (isMounted) {
            setMatches(markPredictedMatches(matchesWithStats, myPredictions));
            setStandingsByLeague({});
          }
          return;
        }

        if (isMounted) {
          setMatches(recentMatches);
          setStandingsByLeague({});
        }
      } catch (error) {
        console.error("커뮤니티 스포츠 데이터 조회 오류:", error);
        if (isMounted) {
          setErrorMessage("스포츠 데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSportsData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, view]);

  const visibleLeagues = useMemo(
    () =>
      activeLeagueId === "all"
        ? LEAGUES
        : LEAGUES.filter((league) => league.id === activeLeagueId),
    [activeLeagueId],
  );
  const leagueMatches = useMemo(
    () => groupByLeague(matches, visibleLeagues),
    [matches, visibleLeagues],
  );

  return (
    <>
      <CommunitySubNav activeItemId={view} />

      <section className={styles.page}>
        <div className={`container ${styles.inner}`}>
          <header className={styles.pageHeader}>
            <p className={styles.eyebrow}>{pageMeta.eyebrow}</p>
            <h1 className={styles.title}>{pageMeta.title}</h1>
          </header>

          <div className={styles.controlArea}>
            <div className={styles.filterArea}>
              <MatchFilter
                filters={LEAGUE_FILTERS}
                activeFilter={activeLeagueId}
                onChange={setActiveLeagueId}
              />
            </div>
          </div>

          {isLoading && (
            <SportsPageSkeleton leagues={visibleLeagues} view={view} />
          )}
          {!isLoading && errorMessage && <EmptyState title={errorMessage} />}

          {!isLoading && !errorMessage && view === "standings" && (
            <div className={styles.sections}>
              {visibleLeagues.map((league) => {
                const standings = standingsByLeague[league.id] ?? [];

                return (
                  <LeagueSection
                    description={standings[0]?.source ?? "공식 순위 기준"}
                    key={league.id}
                    league={league}
                    title={`${league.label} ${pageMeta.sectionTitle}`}
                  >
                    {standings.length > 0 ? (
                      <StandingsTable league={league} standings={standings} />
                    ) : (
                      <EmptyState
                        className={styles.compactEmpty}
                        title={`${league.label} ${pageMeta.emptyTitle}`}
                      />
                    )}
                  </LeagueSection>
                );
              })}
            </div>
          )}

          {!isLoading && !errorMessage && view !== "standings" && (
            <div className={styles.sections}>
              {leagueMatches.map((league) => {
                const visibleMatches = league.items.slice(0, MATCH_RESULT_LIMIT);

                return (
                  <LeagueSection
                    description={`최대 ${MATCH_RESULT_LIMIT}경기`}
                    key={league.id}
                    league={league}
                    title={`${league.label} ${pageMeta.sectionTitle}`}
                  >
                    {visibleMatches.length > 0 ? (
                      <div className={styles.matchGrid}>
                        {visibleMatches.map((match) => (
                          <PredictionResultMatchCard
                            key={`${view}-${match.id}`}
                            match={match}
                            showPrediction={view === "prediction-results"}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        className={styles.compactEmpty}
                        title={`${league.label} ${pageMeta.emptyTitle}`}
                      />
                    )}
                  </LeagueSection>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default CommunitySportsPage;
