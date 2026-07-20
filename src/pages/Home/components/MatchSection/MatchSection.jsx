import { useState } from "react";
import MatchCard from "../../../../components/MatchCard/MatchCard";
import MatchFilter from "../../../../components/MatchFilter/MatchFilter";
import styles from "./MatchSection.module.css";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "soccer", label: "SOCCER" },
  { id: "baseball", label: "BASEBALL" },
  { id: "basketball", label: "BASKETBALL" },
  { id: "esports", label: "LOL" },
];

const MATCHES = [
  {
    id: 1,
    sport: "baseball",
    sportLabel: "BASEBALL",
    league: "KBO",
    date: "07.16",
    day: "목",
    time: "18:30",
    venue: "잠실",
    homeTeam: {
      name: "두산 베어스",
      shortName: "두산",
      logo: "logos/doosan.png",
    },
    awayTeam: {
      name: "NC 다이노스",
      shortName: "NC",
      logo: "logos/nc.png",
    },
    homeVotes: 634,
    awayVotes: 366,
  },
  {
    id: 2,
    sport: "soccer",
    sportLabel: "SOCCER",
    league: "K LEAGUE",
    date: "07.17",
    day: "금",
    time: "21:00",
    venue: "서울 월드컵 경기장",
    homeTeam: {
      name: "FC 서울",
      shortName: "서울",
      logo: "logos/seoul.png",
    },
    awayTeam: {
      name: "수원 삼성",
      shortName: "수원",
      logo: "logos/suwon.png",
    },
    homeVotes: 572,
    awayVotes: 428,
  },
  {
    id: 3,
    sport: "basketball",
    sportLabel: "BASKETBALL",
    league: "KBL",
    date: "07.18",
    day: "토",
    time: "17:00",
    venue: "잠실 학생체육관",
    homeTeam: {
      name: "서울 SK",
      shortName: "SK",
      logo: "logos/seoul-sk.png",
    },
    awayTeam: {
      name: "수원 KT",
      shortName: "KT",
      logo: "logos/suwon-kt.png",
    },
    homeVotes: 449,
    awayVotes: 551,
  },
  {
    id: 4,
    sport: "esports",
    sportLabel: "LOL",
    league: "LCK",
    date: "07.19",
    day: "일",
    time: "19:30",
    venue: "롤파크",
    homeTeam: {
      name: "T1",
      shortName: "T1",
      logo: "logos/t1.png",
    },
    awayTeam: {
      name: "젠지",
      shortName: "GEN",
      logo: "logos/geng.png",
    },
    homeVotes: 718,
    awayVotes: 282,
  },
];

const MatchSection = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredMatches =
    activeFilter === "all"
      ? MATCHES
      : MATCHES.filter((match) => match.sport === activeFilter);

  return (
    <section className={styles.matchSection}>
      <div className={`container ${styles.inner}`}>
        <MatchFilter
          filters={FILTERS}
          activeFilter={activeFilter}
          onChange={setActiveFilter}
        />

        <header className={styles.sectionHeader}>
          <h2 className={styles.title}>MATCHES</h2>
          <p className={styles.dateRange}>2026.07.13~2026.07.19</p>
        </header>

        {filteredMatches.length > 0 ? (
          <div className={styles.matchList}>
            {filteredMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyMessage}>예정된 경기가 없습니다.</p>
        )}
      </div>
    </section>
  );
};

export default MatchSection;
