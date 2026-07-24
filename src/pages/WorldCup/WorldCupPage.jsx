import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MatchFilter from "../../components/MatchFilter/MatchFilter";
import WorldCupCard from "./components/WorldCupCard/WorldCupCard";
import styles from "./WorldCupPage.module.css";

const WORLD_CUP_FILTERS = [
  { id: "all", label: "전체" },
  { id: "soccer", label: "SOCCER" },
  { id: "baseball", label: "BASEBALL" },
  { id: "esports", label: "LOL" },
];

const WORLD_CUPS = [
  {
    id: "baseball-team",
    playId: "baseball",
    category: "BASEBALL",
    title: "KBO 최애 팀",
    round: "16강",
    description: "응원하고 싶은 KBO 팀을 골라보세요.",
    leftImage: "/logos/lg.png",
    rightImage: "/logos/hanwha.png",
  },
  {
    id: "baseball-player",
    playId: "baseball",
    category: "BASEBALL",
    title: "KBO 최애 선수",
    round: "32강",
    description: "실력과 매력을 모두 갖춘 최애 선수를 찾아보세요.",
    leftImage: "/logos/kiwoom.png",
    rightImage: "/logos/samsung.png",
  },
  {
    id: "baseball-situation",
    playId: "baseball",
    category: "BASEBALL",
    title: "야구 보면서 가장 짜증나는 상황 월드컵",
    round: "32강",
    description: "여러분들이 야구 보면서 뭐가 제일 화가 나는지 고르세요.",
    leftImage: "/logos/kiwoom.png",
    rightImage: "/logos/samsung.png",
  },
  {
    id: "soccer-team",
    playId: "soccer",
    category: "SOCCER",
    title: "K리그 최애",
    round: "16강",
    description: "가장 마음이 가는 K리그 팀을 선택해 보세요.",
    leftImage: "",
    rightImage: "",
  },
  {
    id: "soccer-player",
    playId: "soccer",
    category: "SOCCER",
    title: "축구 최애 선수",
    round: "32강",
    description: "나만의 최고의 축구 선수를 가려보세요.",
    leftImage: "",
    rightImage: "",
  },
  {
    id: "lol-team",
    playId: "esports",
    category: "LOL",
    title: "LCK 최애",
    round: "16강",
    description: "내 마음속 최고의 LCK 팀을 선택해 보세요.",
    leftImage: "",
    rightImage: "",
  },
  {
    id: "lol-player",
    playId: "esports",
    category: "LOL",
    title: "LCK 최애 선수",
    round: "32강",
    description: "플레이와 매력을 비교해 최애 선수를 찾아보세요.",
    leftImage: "",
    rightImage: "",
  },
];

const WorldCupPage = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredWorldCups =
    activeFilter === "all"
      ? WORLD_CUPS
      : WORLD_CUPS.filter((worldCup) => worldCup.playId === activeFilter);

  const handleStart = (playId) => {
    navigate(`/worldcup/${playId}`);
  };

  return (
    <main className={styles.worldCupPage}>
      <div className="container">
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>PICK YOUR FAVORITE</p>
          <h1 className={styles.title}>PICK BATTLE</h1>
          <p className={styles.description}>
            둘 중 하나를 선택하며 나만의 최애를 찾아보세요.
          </p>
        </header>

        <div className={styles.filterArea}>
          <MatchFilter
            filters={WORLD_CUP_FILTERS}
            activeFilter={activeFilter}
            onChange={setActiveFilter}
          />
        </div>

        <section
          className={styles.worldCupGrid}
          aria-label="이상형 월드컵 목록"
        >
          {filteredWorldCups.map((worldCup) => (
            <WorldCupCard
              key={worldCup.id}
              worldCup={worldCup}
              onStart={() => handleStart(worldCup.playId)}
            />
          ))}
        </section>
      </div>
    </main>
  );
};

export default WorldCupPage;
