import { getTeamsByIds } from "../../Teams/data/teams";

const createTeamCandidates = (teams, leagueName) =>
  teams.map((team) => ({
    id: team.id,
    title: team.name,
    description: `${leagueName} · ${team.home}`,
    image: team.logo,
  }));

// BASEBALL
// 야구 보면서 가장 짜증나는 상황
const BASEBALL_SITUATION_CANDIDATES = [
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
];

// 팀 / 선수
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

const KBO_TEAMS = getTeamsByIds(KBO_PLAYER_PICKS.map((pick) => pick.teamId));
const KBO_TEAM_CANDIDATES = createTeamCandidates(KBO_TEAMS, "KBO");

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

// SOCCER
// 팀 / 선수
const KLEAGUE_PLAYER_PICKS = [
  { teamId: "kleague-ulsan", playerName: "MARCOS" },
  { teamId: "kleague-jeonbuk", playerName: "Hyeon KANG" },
  { teamId: "kleague-seoul", playerName: "SeonMin" },
  { teamId: "kleague-pohang", playerName: "Yonghak" },
  { teamId: "kleague-daejeon", playerName: "Diogo DE OLIVEIRA BARBOSA" },
  { teamId: "kleague-daegu", playerName: "Minyoung KIM" },
  { teamId: "kleague-jeju", playerName: "Sinjin KIM" },
  { teamId: "kleague-gangwon", playerName: "Gunhee" },
];

const KLEAGUE_TEAMS = getTeamsByIds(
  KLEAGUE_PLAYER_PICKS.map((pick) => pick.teamId),
);
const KLEAGUE_TEAM_CANDIDATES = createTeamCandidates(KLEAGUE_TEAMS, "K리그");

const KLEAGUE_PLAYER_CANDIDATES = KLEAGUE_PLAYER_PICKS.map((pick) => {
  const team = KLEAGUE_TEAMS.find((item) => item.id === pick.teamId);
  const player = team?.members.find(
    (member) => member.name === pick.playerName,
  );

  return {
    id: player?.id || `${pick.teamId}-${pick.playerName}`,
    title: pick.playerName,
    description: `${team?.name || "K리그"} · ${player?.role || "선수"}`,
    image: player?.photo || "",
  };
});

// 짜증나는 상황
const SOCCER_SITUATION_CANDIDATES = [];

// LOL
// LCK 썸네일 이상형 월드컵
const LCK_THUMBNAIL_CANDIDATES = [
  {
    id: "lck-thumbnail-01",
    title: "룰 윅",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/368e29ebc55220b7b0414514ad415d1b.jpg",
  },
  {
    id: "lck-thumbnail-02",
    title: "창! 창! 후루후루!",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/dece0c7b1b7b6d5b26187e44a0a63962.jpg",
  },
  {
    id: "lck-thumbnail-03",
    title: "한화둘셋 야!!!! 천방지축 어리둥절 빙글빙글 돌아가는~",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/b88a5233398ef78fdcd63df7d82730ba.jpg",
  },
  {
    id: "lck-thumbnail-04",
    title: "뽀삐넛",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/846a61c328048032c20a35e0666773e7.jpg",
  },
  {
    id: "lck-thumbnail-05",
    title: "-이민형 단편시 ‘바텀 갱’ 中에서-",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/e376a80db7179fbd09487b80e67eec90.jpg",
  },
  {
    id: "lck-thumbnail-06",
    title: "피했죠?",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/f1b3f65cc5299c158c84a07ba3fcbda2.jpg",
  },
  {
    id: "lck-thumbnail-07",
    title: "축하해주라 나 장학금 받아",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/4be4bc60d07a3d866d2bd6ffdb68317e.jpg",
  },
  {
    id: "lck-thumbnail-08",
    title: "11년 전통 원조 맛집",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/120713901c7a3a186639b17a4998b6da.jpg",
  },
  {
    id: "lck-thumbnail-09",
    title: "안심하라. 이것는 허위광고가 아닙니다!",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/6fedabada25cc22451b0e6c0806382d6.jpg",
  },
  {
    id: "lck-thumbnail-10",
    title: "ㅈㄱㅊㅇ",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/603c5d61f4eea9d0e954639fb0e1642d.jpg",
  },
  {
    id: "lck-thumbnail-11",
    title: "룰골러스",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/c1c9318ba456032c43a7621f5f3e2abe.jpg",
  },
  {
    id: "lck-thumbnail-12",
    title: "AD Carry",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/0e9c23b6c41bc60d884e3ab5917e391d.jpg",
  },
  {
    id: "lck-thumbnail-13",
    title: "탱탱한 최우젤리",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/695db4536d4f8211295b47086418da26.jpg",
  },
  {
    id: "lck-thumbnail-14",
    title: "The Last Mapogo-Derby",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/d262bdadd472f7de078eb9ae9105e670.jpg",
  },
  {
    id: "lck-thumbnail-15",
    title: "롤윤발과 시라카",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/49ec4eb246c8789688dfc9c58db1f553.jpg",
  },
  {
    id: "lck-thumbnail-16",
    title: "League of Legend",
    description: "마음에 드는 LCK 썸네일을 선택해 보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/58faaf2a4203760966a3ed99cca92727.jpg",
  },
];

// 팀 / 선수
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

const LCK_TEAMS = getTeamsByIds(LCK_PLAYER_PICKS.map((pick) => pick.teamId));
const LCK_TEAM_CANDIDATES = createTeamCandidates(LCK_TEAMS, "LCK");

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
  // BASEBALL
  {
    id: "baseball-situation",
    playId: "baseball",
    category: "BASEBALL",
    title: "야구 보면서 가장 짜증나는 상황 월드컵",
    round: "8강",
    description: "야구를 볼 때 가장 참기 힘든 순간을 골라보세요.",
    leftImage: "/logos/kiwoom.png",
    rightImage: "/logos/samsung.png",
    candidates: BASEBALL_SITUATION_CANDIDATES,
  },
  {
    id: "baseball-team",
    playId: "baseball",
    category: "BASEBALL",
    title: "KBO 최애 팀",
    round: "8강",
    description: "응원하고 싶은 KBO 팀을 골라보세요.",
    leftImage: KBO_TEAM_CANDIDATES[0].image,
    rightImage: KBO_TEAM_CANDIDATES[1].image,
    candidates: KBO_TEAM_CANDIDATES,
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

  // SOCCER
  {
    id: "soccer-team",
    playId: "soccer",
    category: "SOCCER",
    title: "K리그 최애 팀",
    round: "8강",
    description: "가장 마음이 가는 K리그 팀을 선택해 보세요.",
    leftImage: KLEAGUE_TEAM_CANDIDATES[0].image,
    rightImage: KLEAGUE_TEAM_CANDIDATES[1].image,
    candidates: KLEAGUE_TEAM_CANDIDATES,
  },
  {
    id: "soccer-player",
    playId: "soccer",
    category: "SOCCER",
    title: "K리그 최애 선수",
    round: "8강",
    description: "K리그 선수 중 나만의 최애 선수를 골라보세요.",
    leftImage: KLEAGUE_PLAYER_CANDIDATES[0].image,
    rightImage: KLEAGUE_PLAYER_CANDIDATES[1].image,
    candidates: KLEAGUE_PLAYER_CANDIDATES,
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
    candidates: SOCCER_SITUATION_CANDIDATES,
  },

  // LOL
  {
    id: "lol-thumbnail",
    playId: "esports",
    category: "LOL",
    title: "LCK 썸네일 이상형 월드컵",
    round: "16강",
    description: "마음에 드는 LCK 썸네일을 골라보세요.",
    leftImage: LCK_THUMBNAIL_CANDIDATES[0].image,
    rightImage: LCK_THUMBNAIL_CANDIDATES[1].image,
    candidates: LCK_THUMBNAIL_CANDIDATES,
  },
  {
    id: "lol-team",
    playId: "esports",
    category: "LOL",
    title: "LCK 최애 팀",
    round: "8강",
    description: "내 마음속 최고의 LCK 팀을 선택해 보세요.",
    leftImage: LCK_TEAM_CANDIDATES[0].image,
    rightImage: LCK_TEAM_CANDIDATES[1].image,
    candidates: LCK_TEAM_CANDIDATES,
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
