import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../../components/EmptyState/EmptyState";
import MatchFilter from "../../../components/MatchFilter/MatchFilter";
import PredictionResultInsight from "../../../components/PredictionResultInsight/PredictionResultInsight";
import Skeleton from "../../../components/Skeleton/Skeleton";
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

const STANDING_COLUMNS = {
  kbo: [
    { key: "games", label: "경기" },
    { key: "wins", label: "승" },
    { key: "draws", label: "무", optional: true },
    { key: "losses", label: "패" },
    { key: "games_behind", label: "게임차", optional: true },
    { key: "win_rate", label: "승률", render: (row) => formatWinRate(row.win_rate) },
  ],
  kleague: [
    { key: "games", label: "경기" },
    { key: "points", label: "승점" },
    { key: "wins", label: "승" },
    { key: "draws", label: "무", optional: true },
    { key: "losses", label: "패" },
    { key: "score_diff", label: "득실", optional: true },
  ],
  lck: [
    { key: "games", label: "경기" },
    { key: "wins", label: "승" },
    { key: "losses", label: "패" },
    { key: "score_diff", label: "득실", optional: true },
    { key: "win_rate", label: "승률", render: (row) => formatWinRate(row.win_rate) },
    { key: "kda", label: "KDA", optional: true },
  ],
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

const formatValue = (value) =>
  value === null || value === undefined || value === "" ? "-" : value;

const formatWinRate = (value) => {
  const rate = Number(value);

  if (!Number.isFinite(rate)) return "-";

  return rate.toFixed(3);
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
  const { awayScore, homeScore } = parseScore(match.score);

  return {
    id: match.id,
    databaseId: match.id,
    leagueId,
    leagueLabel: league?.label ?? match.league,
    sport: match.sport,
    sportLabel: league?.sportLabel ?? match.sport?.toUpperCase(),
    dateKey: match.match_date,
    dateLabel: formatShortDate(match.match_date),
    time: match.match_time?.slice(0, 5) ?? "--:--",
    status: match.status,
    score: match.score,
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
    .filter(isResultMatch)
    .map(normalizeMatch);
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

const TeamLogo = ({ team, variant = "default" }) => (
  <span
    className={[
      styles.teamLogo,
      variant === "standing" ? styles.standingLogo : "",
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {team.logo ? (
      <img src={team.logo} alt="" loading="lazy" />
    ) : (
      <span>{team.shortName?.slice(0, 2) ?? "-"}</span>
    )}
  </span>
);

const StandingsTable = ({ league, standings }) => {
  const columns = STANDING_COLUMNS[league.id] ?? STANDING_COLUMNS.kbo;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.standingsTable}>
        <thead>
          <tr>
            <th>순위</th>
            <th>팀</th>
            {columns.map((column) => (
              <th
                className={column.optional ? styles.optionalColumn : ""}
                key={column.key}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((standing) => {
            const team = getDisplayTeam(standing.team_code, league.sport);

            return (
              <tr key={`${league.id}-${standing.team_id ?? standing.team_code}`}>
                <td>{standing.rank}</td>
                <td>
                  <span className={styles.standingTeam}>
                    <TeamLogo team={team} variant="standing" />
                    <b>{team.name || standing.team_name}</b>
                  </span>
                </td>
                {columns.map((column) => (
                  <td
                    className={column.optional ? styles.optionalColumn : ""}
                    key={column.key}
                  >
                    {column.render
                      ? column.render(standing)
                      : formatValue(standing[column.key])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const MatchTeam = ({ align = "left", score, team }) => (
  <div className={`${styles.matchTeam} ${align === "right" ? styles.rightTeam : ""}`}>
    <TeamLogo team={team} />
    <span>{team.name}</span>
    {score !== null && <b>{score}</b>}
  </div>
);

const PredictionRateBar = ({ awayRate, awayTeam, homeRate, homeTeam }) => (
  <div className={styles.predictionRates}>
    <div className={styles.rateLabels}>
      <span>
        {awayTeam.name} <b>{awayRate}%</b>
      </span>
      <span>
        <b>{homeRate}%</b> {homeTeam.name}
      </span>
    </div>
    <div className={styles.rateTrack}>
      <span style={{ width: `${awayRate}%` }} />
    </div>
  </div>
);

const CommunityMatchCard = ({ match, showPrediction = false }) => {
  const awayRate = Number(match.awayVotes ?? 50);
  const homeRate = Number(match.homeVotes ?? 50);

  return (
    <article className={styles.matchCard}>
      <div className={styles.matchTop}>
        <span>
          {match.sportLabel} · {match.leagueLabel}
        </span>
        <b>
          {match.dateLabel} · {match.time}
        </b>
      </div>

      <div className={styles.matchScore}>
        <MatchTeam team={match.awayTeam} score={match.awayScore} />
        <strong>VS</strong>
        <MatchTeam align="right" team={match.homeTeam} score={match.homeScore} />
      </div>

      {showPrediction && (
        <PredictionRateBar
          awayRate={awayRate}
          awayTeam={match.awayTeam}
          homeRate={homeRate}
          homeTeam={match.homeTeam}
        />
      )}

      {showPrediction && (
        <>
          <PredictionResultInsight match={match} />

          <p className={styles.participants}>
            {match.participants.toLocaleString()}명 참여
          </p>
        </>
      )}
    </article>
  );
};

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
                          <CommunityMatchCard
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
