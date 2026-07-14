import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../../contexts/useAuth";
import FanPickDialog from "../../../../components/FanPickDialog/FanPickDialog";
import MatchFilter from "../../../../components/MatchFilter/MatchFilter";
import styles from "./HotMatchSection.module.css";

const FILTERS = [
  { id: "baseball", label: "BASEBALL" },
  { id: "soccer", label: "SOCCER" },
  { id: "basketball", label: "BASKETBALL" },
  { id: "esports", label: "LOL" },
];

const HOT_MATCHES = [
  {
    id: 1,
    sport: "baseball",
    league: "KBO",
    date: "07.18",
    time: "18:00",
    homeTeam: {
      name: "두산 베어스",
      shortName: "DOOSAN",
      logo: "/images/team-logos/doosan.png",
    },
    awayTeam: {
      name: "NC 다이노스",
      shortName: "NC",
      logo: "/images/team-logos/nc.png",
    },
  },
  {
    id: 2,
    sport: "soccer",
    league: "K LEAGUE",
    date: "07.19",
    time: "19:30",
    homeTeam: {
      name: "FC 서울",
      shortName: "SEOUL",
      logo: "/images/team-logos/seoul.png",
    },
    awayTeam: {
      name: "수원 삼성",
      shortName: "SUWON",
      logo: "/images/team-logos/suwon.png",
    },
  },
  {
    id: 3,
    sport: "basketball",
    league: "KBL",
    date: "07.20",
    time: "17:00",
    homeTeam: {
      name: "서울 SK",
      shortName: "SK",
      logo: "/images/team-logos/seoul-sk.png",
    },
    awayTeam: {
      name: "수원 KT",
      shortName: "KT",
      logo: "/images/team-logos/suwon-kt.png",
    },
  },
  {
    id: 4,
    sport: "esports",
    league: "LCK",
    date: "07.21",
    time: "19:30",
    homeTeam: {
      name: "T1",
      shortName: "T1",
      logo: "/images/team-logos/t1.png",
    },
    awayTeam: {
      name: "젠지",
      shortName: "GEN.G",
      logo: "/images/team-logos/geng.png",
    },
  },
];

const HotMatchSection = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isAuthLoading } = useAuth();

  const [activeFilter, setActiveFilter] = useState("baseball");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingVote, setPendingVote] = useState(null);

  const hotMatch = HOT_MATCHES.find((match) => match.sport === activeFilter);

  const handleVoteClick = (selectedTeam) => {
    if (isAuthLoading || !hotMatch) return;

    const predictionPath = `/prediction?matchId=${hotMatch.id}&team=${selectedTeam}`;

    if (!isLoggedIn) {
      setPendingVote({
        matchId: hotMatch.id,
        selectedTeam,
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

    const search =
      `?matchId=${pendingVote.matchId}` + `&team=${pendingVote.selectedTeam}`;

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
              오늘 가장 주목할 경기의 승리 팀을 선택해 보세요.
            </p>
          </header>

          <MatchFilter
            filters={FILTERS}
            activeFilter={activeFilter}
            onChange={setActiveFilter}
          />

          <div className={styles.content}>
            {hotMatch ? (
              <article className={styles.hotMatch}>
                <div className={styles.teamColumn}>
                  <div className={styles.teamCard}>
                    <div className={styles.logoBox}>
                      <img
                        src={hotMatch.homeTeam.logo}
                        alt={`${hotMatch.homeTeam.name} 로고`}
                      />
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
                    onClick={() => handleVoteClick("home")}
                    disabled={isAuthLoading}
                  >
                    투표하기
                  </button>
                </div>

                <div className={styles.matchInfo}>
                  <strong className={styles.vs}>VS</strong>

                  <div className={styles.schedule}>
                    <span className={styles.date}>{hotMatch.date}</span>

                    <span className={styles.time}>{hotMatch.time}</span>
                  </div>
                </div>

                <div className={styles.teamColumn}>
                  <div className={styles.teamCard}>
                    <div className={styles.logoBox}>
                      <img
                        src={hotMatch.awayTeam.logo}
                        alt={`${hotMatch.awayTeam.name} 로고`}
                      />
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
                    onClick={() => handleVoteClick("away")}
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
