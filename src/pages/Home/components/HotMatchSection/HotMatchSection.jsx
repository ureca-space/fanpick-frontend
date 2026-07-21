import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FanPickDialog from "../../../../components/FanPickDialog/FanPickDialog";
import MatchFilter from "../../../../components/MatchFilter/MatchFilter";
import { getTeamInfo } from "../../../../constants/teamInfo";
import useAuth from "../../../../contexts/useAuth";
import { supabase } from "../../../../lib/supabase";
import styles from "./HotMatchSection.module.css";

const FILTERS = [
  { id: "baseball", label: "BASEBALL" },
  { id: "soccer", label: "SOCCER" },
  { id: "esports", label: "LOL" },
];

const padNumber = (number) => String(number).padStart(2, "0");

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());

  return `${year}-${month}-${day}`;
};

const formatMatchDate = (dateKey) => {
  if (!dateKey) return "미정";

  const [, month, day] = dateKey.split("-");

  return `${month}.${day}`;
};

const createMatchDateTime = (matchDate, matchTime) => {
  if (!matchDate) return null;

  const [year, month, day] = matchDate.split("-").map(Number);
  const [hour = 23, minute = 59] = (matchTime ?? "")
    .slice(0, 5)
    .split(":")
    .map(Number);

  const dateTime = new Date(
    year,
    month - 1,
    day,
    Number.isFinite(hour) ? hour : 23,
    Number.isFinite(minute) ? minute : 59,
    0,
    0,
  );

  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
};

const normalizeHotMatch = (match) => ({
  id: match.external_id,
  sport: match.sport,
  league: match.league,

  date: formatMatchDate(match.match_date),
  time: match.match_time?.slice(0, 5) ?? "미정",

  homeTeamCode: match.home_team_code,
  awayTeamCode: match.away_team_code,

  homeTeam: getTeamInfo(match.home_team_code, match.sport),
  awayTeam: getTeamInfo(match.away_team_code, match.sport),

  status: match.status,
  venue: match.venue,
  broadcast: match.broadcast,
});

const fetchNearestMatch = async (sport, now) => {
  const todayKey = formatDateKey(now);

  const { data, error } = await supabase
    .from("matches")
    .select(
      `
        external_id,
        sport,
        league,
        match_date,
        match_time,
        home_team_code,
        away_team_code,
        status,
        venue,
        broadcast
      `,
    )
    .eq("sport", sport)
    .eq("status", "scheduled")
    .gte("match_date", todayKey)
    .order("match_date", {
      ascending: true,
    })
    .order("match_time", {
      ascending: true,
    })
    .limit(30);

  if (error) {
    throw error;
  }

  const nearestMatch = (data ?? []).find((match) => {
    if (!match.home_team_code || !match.away_team_code) {
      return false;
    }

    const matchDateTime = createMatchDateTime(
      match.match_date,
      match.match_time,
    );

    return matchDateTime && matchDateTime.getTime() > now.getTime();
  });

  return nearestMatch ? normalizeHotMatch(nearestMatch) : null;
};

const HotMatchSection = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isAuthLoading } = useAuth();

  const [hotMatches, setHotMatches] = useState({});
  const [activeFilter, setActiveFilter] = useState("baseball");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingVote, setPendingVote] = useState(null);

  const hotMatch = hotMatches[activeFilter] ?? null;

  useEffect(() => {
    let isMounted = true;

    const loadHotMatches = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const now = new Date();

        const results = await Promise.all(
          FILTERS.map(async ({ id }) => {
            const match = await fetchNearestMatch(id, now);

            return [id, match];
          }),
        );

        if (!isMounted) return;

        const nextHotMatches = Object.fromEntries(results);

        setHotMatches(nextHotMatches);

        setActiveFilter((previousFilter) => {
          if (nextHotMatches[previousFilter]) {
            return previousFilter;
          }

          const firstAvailableFilter = FILTERS.find(
            ({ id }) => nextHotMatches[id],
          );

          return firstAvailableFilter?.id ?? previousFilter;
        });
      } catch (error) {
        console.error("핫매치 불러오기 실패", error);

        if (isMounted) {
          setLoadError("핫매치를 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHotMatches();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleVoteClick = (selectedTeamCode) => {
    if (isAuthLoading || !hotMatch) return;

    const matchId = encodeURIComponent(hotMatch.id);
    const teamCode = encodeURIComponent(selectedTeamCode);

    const predictionPath =
      `/prediction?matchId=${matchId}` + `&team=${teamCode}`;

    if (!isLoggedIn) {
      setPendingVote({
        matchId: hotMatch.id,
        selectedTeamCode,
      });

      setIsDialogOpen(true);
      return;
    }

    navigate(predictionPath);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setPendingVote(null);
  };

  const handleMoveToLogin = () => {
    if (!pendingVote) return;

    const matchId = encodeURIComponent(pendingVote.matchId);
    const teamCode = encodeURIComponent(pendingVote.selectedTeamCode);

    const search = `?matchId=${matchId}&team=${teamCode}`;

    setIsDialogOpen(false);
    setPendingVote(null);

    navigate("/login", {
      state: {
        from: {
          pathname: "/prediction",
          search,
          hash: "",
        },
      },
    });
  };

  return (
    <>
      <section className={`section ${styles.hotMatchSection}`}>
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 className={styles.title}>HOT MATCH</h2>

            <p className={styles.description}>
              다가오는 경기의 승리 팀을 선택해 보세요.
            </p>
          </header>

          <MatchFilter
            filters={FILTERS}
            activeFilter={activeFilter}
            onChange={setActiveFilter}
          />

          <div className={styles.content}>
            {isLoading ? (
              <p className={styles.emptyMessage}>핫매치를 불러오는 중입니다.</p>
            ) : loadError ? (
              <p className={styles.emptyMessage}>{loadError}</p>
            ) : hotMatch ? (
              <article className={styles.hotMatch}>
                <div className={styles.teamColumn}>
                  <div className={styles.teamCard}>
                    <div className={styles.logoBox}>
                      {hotMatch.homeTeam.logo ? (
                        <img
                          src={hotMatch.homeTeam.logo}
                          alt={`${hotMatch.homeTeam.name} 로고`}
                        />
                      ) : (
                        <span>{hotMatch.homeTeam.shortName}</span>
                      )}
                    </div>

                    <div className={styles.teamNameBox}>
                      <strong className={styles.teamName}>
                        {hotMatch.homeTeam.shortName}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.selectButton}
                    onClick={() => handleVoteClick(hotMatch.homeTeamCode)}
                    disabled={isAuthLoading}
                  >
                    투표하기
                  </button>
                </div>

                <div className={styles.matchInfo}>
                  <span className={styles.league}>{hotMatch.league}</span>

                  <strong className={styles.vs}>VS</strong>

                  <div className={styles.schedule}>
                    <span className={styles.date}>{hotMatch.date}</span>

                    <span className={styles.time}>{hotMatch.time}</span>
                  </div>
                </div>

                <div className={styles.teamColumn}>
                  <div className={styles.teamCard}>
                    <div className={styles.logoBox}>
                      {hotMatch.awayTeam.logo ? (
                        <img
                          src={hotMatch.awayTeam.logo}
                          alt={`${hotMatch.awayTeam.name} 로고`}
                        />
                      ) : (
                        <span>{hotMatch.awayTeam.shortName}</span>
                      )}
                    </div>

                    <div className={styles.teamNameBox}>
                      <strong className={styles.teamName}>
                        {hotMatch.awayTeam.shortName}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.selectButton}
                    onClick={() => handleVoteClick(hotMatch.awayTeamCode)}
                    disabled={isAuthLoading}
                  >
                    투표하기
                  </button>
                </div>
              </article>
            ) : (
              <p className={styles.emptyMessage}>
                예정된 주요 경기가 없습니다.
              </p>
            )}
          </div>
        </div>
      </section>

      <FanPickDialog
        isOpen={isDialogOpen}
        title="로그인이 필요합니다"
        description="핫매치 투표에 참여하려면 먼저 로그인해 주세요."
        confirmText="로그인하기"
        cancelText="취소"
        onClose={handleCloseDialog}
        onConfirm={handleMoveToLogin}
      />
    </>
  );
};

export default HotMatchSection;
