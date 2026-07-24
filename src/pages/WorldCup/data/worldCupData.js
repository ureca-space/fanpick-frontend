import { getTeamsByIds } from "../../Teams/data/teams";

const KBO_PLAYER_PICKS = [
  { teamId: "kbo-doosan", playerName: "양의지" },
  { teamId: "kbo-lg", playerName: "오지환" },
  { teamId: "kbo-kia", playerName: "김도영" },
  { teamId: "kbo-samsung", playerName: "구자욱" },
  { teamId: "kbo-lotte", playerName: "전준우" },
  { teamId: "kbo-hanwha", playerName: "류현진" },
  { teamId: "kbo-ssg", playerName: "최정" },
  { teamId: "kbo-kiwoom", playerName: "이주형" },
];

const KBO_TEAMS = getTeamsByIds(
  KBO_PLAYER_PICKS.map((pick) => pick.teamId),
);

const KBO_PLAYER_CANDIDATES = KBO_PLAYER_PICKS.map((pick) => {
  const team = KBO_TEAMS.find((item) => item.id === pick.teamId);
  const player = team?.members.find(
    (member) => member.name === pick.playerName,
  );

  return {
    id: player?.id || `${pick.teamId}-${pick.playerName}`,
    title: pick.playerName,
    description: `${team?.name || "KBO"} · ${player?.role || "선수"}`,
    image: player?.photo || "",
  };
});

const LCK_PLAYER_PICKS = [
  { teamId: "lck-t1", playerName: "Faker" },
  { teamId: "lck-gen", playerName: "Chovy" },
  { teamId: "lck-hle", playerName: "Zeus" },
  { teamId: "lck-dk", playerName: "ShowMaker" },
  { teamId: "lck-kt", playerName: "Bdd" },
  { teamId: "lck-krx", playerName: "Ucal" },
  { teamId: "lck-ns", playerName: "Scout" },
  { teamId: "lck-bfx", playerName: "VicLa" },
];

const LCK_TEAMS = getTeamsByIds(
  LCK_PLAYER_PICKS.map((pick) => pick.teamId),
);

const LCK_PLAYER_CANDIDATES = LCK_PLAYER_PICKS.map((pick) => {
  const team = LCK_TEAMS.find((item) => item.id === pick.teamId);
  const player = team?.members.find(
    (member) => member.name === pick.playerName,
  );

  return {
    id: player?.id || `${pick.teamId}-${pick.playerName}`,
    title: pick.playerName,
    description: `${team?.name || "LCK"} · ${player?.role || "선수"}`,
    image: player?.photo || "",
  };
});

export const WORLD_CUP_FILTERS = [
  { id: "all", label: "전체" },
  { id: "baseball", label: "BASEBALL" },
  { id: "soccer", label: "SOCCER" },
  { id: "esports", label: "LOL" },
];

export const WORLD_CUP_SECTION_LABELS = {
  baseball: "BASEBALL",
  soccer: "SOCCER",
  esports: "LOL",
};

export const WORLD_CUPS = [
  {
    id: "baseball-team",
    playId: "baseball",
    category: "BASEBALL",
    title: "KBO 최애 팀",
    round: "16강",
    description: "응원하고 싶은 KBO 팀을 골라보세요.",
    leftImage: "/logos/lg.png",
    rightImage: "/logos/hanwha.png",
    candidates: [],
  },
  {
    id: "baseball-player",
    playId: "baseball",
    category: "BASEBALL",
    title: "KBO 최애 선수",
    round: "8강",
    description: "실력과 매력을 모두 갖춘 최애 선수를 찾아보세요.",
    leftImage: KBO_PLAYER_CANDIDATES[0].image,
    rightImage: KBO_PLAYER_CANDIDATES[1].image,
    candidates: KBO_PLAYER_CANDIDATES,
  },
  {
    id: "baseball-situation",
    playId: "baseball",
    category: "BASEBALL",
    title: "야구 보면서 가장 짜증나는 상황 월드컵",
    round: "8강",
    description: "야구를 볼 때 가장 참기 힘든 순간을 골라보세요.",
    leftImage: "/logos/kiwoom.png",
    rightImage: "/logos/samsung.png",
    candidates: [
      {
        id: "double-play",
        title: "만루 찬스에서 병살타",
        description: "한 점이면 되는데 초구를 건드려 이닝이 끝난 상황",
      },
      {
        id: "walk-off-loss",
        title: "9회말 끝내기 역전패",
        description: "경기 내내 앞서다가 마지막 아웃을 잡지 못한 상황",
      },
      {
        id: "bullpen-collapse",
        title: "잘 던지던 선발 뒤 불펜 방화",
        description: "선발 투수의 승리 요건이 순식간에 사라진 상황",
      },
      {
        id: "silent-lineup",
        title: "응원팀 타선이 경기 내내 침묵",
        description: "안타는 나오지만 득점권에서 계속 막히는 상황",
      },
      {
        id: "error",
        title: "결정적인 순간 연속 수비 실책",
        description: "잡을 수 있는 타구를 놓치며 실점까지 이어진 상황",
      },
      {
        id: "reversal",
        title: "비디오 판독으로 판정 번복",
        description: "좋아했던 순간이 판독 한 번으로 취소된 상황",
      },
      {
        id: "rain-cancel",
        title: "기다리던 경기가 갑자기 우천 취소",
        description: "경기장에 도착한 뒤 취소 소식을 들은 상황",
      },
      {
        id: "rival-loss",
        title: "라이벌 팀에게 큰 점수 차로 패배",
        description: "경기 초반부터 무너지며 놀림까지 받게 된 상황",
      },
    ],
  },
  {
    id: "soccer-team",
    playId: "soccer",
    category: "SOCCER",
    title: "K리그 최애 팀",
    round: "16강",
    description: "가장 마음이 가는 K리그 팀을 선택해 보세요.",
    leftImage: "",
    rightImage: "",
    candidates: [],
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
    candidates: [],
  },
  {
    id: "soccer-situation",
    playId: "soccer",
    category: "SOCCER",
    title: "축구 보면서 가장 짜증나는 상황 월드컵",
    round: "32강",
    description: "축구를 볼 때 가장 참기 힘든 순간을 골라보세요.",
    leftImage: "",
    rightImage: "",
    candidates: [],
  },
  {
    id: "lol-team",
    playId: "esports",
    category: "LOL",
    title: "LCK 최애 팀",
    round: "16강",
    description: "내 마음속 최고의 LCK 팀을 선택해 보세요.",
    leftImage: "",
    rightImage: "",
    candidates: [],
  },
  {
    id: "lol-player",
    playId: "esports",
    category: "LOL",
    title: "LCK 최애 선수",
    round: "8강",
    description: "플레이와 매력을 비교해 최애 선수를 찾아보세요.",
    leftImage: LCK_PLAYER_CANDIDATES[0].image,
    rightImage: LCK_PLAYER_CANDIDATES[1].image,
    candidates: LCK_PLAYER_CANDIDATES,
  },
];

export const getWorldCupById = (worldCupId) =>
  WORLD_CUPS.find((worldCup) => worldCup.id === worldCupId);
