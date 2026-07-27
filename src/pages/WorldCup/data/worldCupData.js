import { getTeamsByIds } from "../../Teams/data/teams";

const createTeamCandidates = (teams, leagueName) =>
  teams.map((team) => ({
    id: team.id,
    title: team.name,
    description: `${leagueName} · ${team.home}`,
    image: team.logo,
  }));

// BASEBALL
// 야구 웃긴짤
const BASEBALL_FUNNY_CANDIDATES = [
  {
    id: "baseball-funny-02",
    title: "오예스 학살자",
    image: "https://i1.ruliweb.com/ori/16/07/07/155c44411b946c91a.gif",
  },
  {
    id: "baseball-funny-03",
    title: "유희관 나야나",
    image:
      "https://3.bp.blogspot.com/-fAeBDZI3J28/W3bdA-eOr2I/AAAAAAAABQk/OM90tF_AgvIdnfWd2WPZQ496vw-QqUDPgCLcBGAs/s1600/99D1CB495B589A8410.gif",
  },
  {
    id: "baseball-funny-04",
    title: "연약한 머리띠",
    image:
      "https://1.bp.blogspot.com/-CNvWE4gjGJo/W3bc86wW4sI/AAAAAAAABQA/6Y4XoDQ7ecUXTc5eYk2NbzLBHaEhh3EWACLcBGAs/s1600/20171126_015351_518281744.gif",
  },
  {
    id: "baseball-funny-05",
    title: "동심파괴",
    image:
      "https://4.bp.blogspot.com/-MIkwEPt8bPw/W3bdABgP7II/AAAAAAAABQg/dWE0T9q0lhQ3Z1173V-LN1GgiDRNJ7KlgCLcBGAs/s1600/99C1014E5B58A29008.gif",
  },
  {
    id: "baseball-funny-06",
    title: "칼군무",
    image:
      "https://t1.daumcdn.net/cafeattach/1IHuH/4884ac26e395069d9b53106964c087e0f10705b0",
  },
  {
    id: "baseball-funny-07",
    title: "간접적인 항의",
    image:
      "https://t1.daumcdn.net/cafeattach/1IHuH/d884bd84e4545c5fa364b312b1dfd3e8c43052b4",
  },
  {
    id: "baseball-funny-08",
    title: "램프의 요정 구자욱",
    image:
      "https://t1.daumcdn.net/cafeattach/1IHuH/fbd46cee8cb128775a0d49b58632b3647ad32d91",
  },
  {
    id: "baseball-funny-09",
    title: "연어초밥",
    image:
      "https://3.bp.blogspot.com/-JjKOD9Smdy4/W3bdAXSFR8I/AAAAAAAABQc/RbaaCh2KpyMoyx3DYfMG7L2jlzvVfqc5gCLcBGAs/s1600/c291357ff24dd84f111470803.jpg",
  },
];

// 야구 보면서 가장 짜증나는 상황
const BASEBALL_SITUATION_CANDIDATES = [
  {
    id: "uniform-number-change",
    title: "유니폼 샀는데 번호 바꿀 때",
    description: "야구를 보며 가장 짜증나는 상황을 골라보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/87oi9R/aebbfd3512dee41741df4e8db34f7746.jpg",
  },
  {
    id: "upset-loss",
    title: "업셋 당할 때",
    description: "야구를 보며 가장 짜증나는 상황을 골라보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/87oi9R/f741b3e5f4bbfd2de5c9e733d2d914e8.jpg",
  },
  {
    id: "bad-commemorative-uniform",
    title: "기념 유니폼 이상할때",
    description: "야구를 보며 가장 짜증나는 상황을 골라보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/87oi9R/5aadf75cd83a9d33a0b4d38a8639db52.jpg",
  },
  {
    id: "simple-pitch-selection",
    title: "볼 배합 단순할 때",
    description: "야구를 보며 가장 짜증나는 상황을 골라보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/87oi9R/870cec9c62c925333ca41f35f432b29d.jpg",
  },
  {
    id: "late-inning-reversal",
    title: "동점상황에서 홈런 맞거나 연속 안타 맞아서 역전당할때",
    description: "야구를 보며 가장 짜증나는 상황을 골라보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/87oi9R/6ccb1872c04c41bf845947e1da083042.jpg",
  },
  {
    id: "lazy-run-to-first",
    title: "1루까지 설렁설렁 갈 때",
    description: "야구를 보며 가장 짜증나는 상황을 골라보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/87oi9R/c2cce6b003ef3bf6456001ee599757cd.jpg",
  },
  {
    id: "fan-on-field",
    title: "야구장에 난입하는 관중",
    description: "야구를 보며 가장 짜증나는 상황을 골라보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/87oi9R/b17af185fcc9781e1221a20bab39ea79.jpg",
  },
  {
    id: "underperforming-foreign-player",
    title: "용병이라고 데려왔는데 우리 팀에서 못하는 애랑 별 차이 없을때",
    description: "야구를 보며 가장 짜증나는 상황을 골라보세요.",
    image:
      "https://img.piku.co.kr/w/uploads/87oi9R/03fa45b5f957221d1d4447695d83bbac.jpg",
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
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/368e29ebc55220b7b0414514ad415d1b.jpg",
  },
  {
    id: "lck-thumbnail-02",
    title: "창! 창! 후루후루!",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/dece0c7b1b7b6d5b26187e44a0a63962.jpg",
  },
  {
    id: "lck-thumbnail-03",
    title: "한화둘셋 야!!!! 천방지축 어리둥절 빙글빙글 돌아가는~",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/b88a5233398ef78fdcd63df7d82730ba.jpg",
  },
  {
    id: "lck-thumbnail-04",
    title: "뽀삐넛",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/846a61c328048032c20a35e0666773e7.jpg",
  },
  {
    id: "lck-thumbnail-05",
    title: "-이민형 단편시 ‘바텀 갱’ 中에서-",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/e376a80db7179fbd09487b80e67eec90.jpg",
  },
  {
    id: "lck-thumbnail-06",
    title: "피했죠?",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/f1b3f65cc5299c158c84a07ba3fcbda2.jpg",
  },
  {
    id: "lck-thumbnail-07",
    title: "축하해주라 나 장학금 받아",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/4be4bc60d07a3d866d2bd6ffdb68317e.jpg",
  },
  {
    id: "lck-thumbnail-08",
    title: "11년 전통 원조 맛집",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/120713901c7a3a186639b17a4998b6da.jpg",
  },
  {
    id: "lck-thumbnail-09",
    title: "안심하라. 이것는 허위광고가 아닙니다!",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/6fedabada25cc22451b0e6c0806382d6.jpg",
  },
  {
    id: "lck-thumbnail-10",
    title: "ㅈㄱㅊㅇ",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/603c5d61f4eea9d0e954639fb0e1642d.jpg",
  },
  {
    id: "lck-thumbnail-11",
    title: "룰골러스",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/c1c9318ba456032c43a7621f5f3e2abe.jpg",
  },
  {
    id: "lck-thumbnail-12",
    title: "AD Carry",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/0e9c23b6c41bc60d884e3ab5917e391d.jpg",
  },
  {
    id: "lck-thumbnail-13",
    title: "탱탱한 최우젤리",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/695db4536d4f8211295b47086418da26.jpg",
  },
  {
    id: "lck-thumbnail-14",
    title: "The Last Mapogo-Derby",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/d262bdadd472f7de078eb9ae9105e670.jpg",
  },
  {
    id: "lck-thumbnail-15",
    title: "롤윤발과 시라카",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/49ec4eb246c8789688dfc9c58db1f553.jpg",
  },
  {
    id: "lck-thumbnail-16",
    title: "League of Legend",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/58faaf2a4203760966a3ed99cca92727.jpg",
  },
  {
    id: "lck-thumbnail-17",
    title: "철마 거인",
    image: "https://i.ytimg.com/vi/NonbgIPN7-I/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-18",
    title: "찾았다 원딜",
    image:
      "https://i.ytimg.com/vi/QyrnjO9YaIE/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAO0lLEjuUqbH4N-elR4SQ7sdfT-A",
  },
  {
    id: "lck-thumbnail-19",
    title: "기마척탄병",
    image:
      "https://i.ytimg.com/vi/z8FvZZWvvdY/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBVjrAVCTreD25E7rbE9TcLQx40Kg",
  },
  {
    id: "lck-thumbnail-20",
    title: "도란헤도로",
    image: "https://i.ytimg.com/vi/63nBnk6yI7c/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-21",
    title: "무적의 양갈래 미소녀 듀오",
    image: "https://i.ytimg.com/vi/5RNgSOkUB40/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-22",
    title: "양갈래 과즙상 장카설'바'",
    image:
      "https://img.piku.co.kr/w/uploads/8VQwpB/e0f1aaa231c55a9bef324c1fca1292d8.jpg",
  },
  {
    id: "lck-thumbnail-23",
    title: "세나의 복수다!",
    image: "https://i.ytimg.com/vi/ZWL4MbzB1Ak/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-24",
    title: "(비어있음)",
    image: "https://i.ytimg.com/vi/tuqbVn5pag0/sddefault.jpg",
  },
  {
    id: "lck-thumbnail-25",
    title: "진짜 보내요?",
    image: "https://i.ytimg.com/vi/rJiY8GCIYVY/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-26",
    title: "무례하긴, 럭포터야",
    image: "https://i.ytimg.com/vi/SxfP2XgQjwQ/mqdefault.jpg",
  },
  {
    id: "lck-thumbnail-27",
    title: "도현아 그게 무슨 말이니",
    image: "https://i.ytimg.com/vi/-VZfw9HqkvE/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-28",
    title: "흔한 젠지 단톡방",
    image: "https://i.ytimg.com/vi/P4--tzAqtto/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-29",
    title: "피터츄! 백만볼트!!!⚡",
    image: "https://i.ytimg.com/vi/6qYIq1B7ULI/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-30",
    title: "뉴네오프레쉬영빅프론티어디플러스기아",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkAc0nSqcgdU-3RkHKI4OC7OL7i4pyiNRoaQ8DwN82g4wXNJoXd767kqk&s=10",
  },
  {
    id: "lck-thumbnail-31",
    title: "이 중 나의 X가 있다",
    image: "https://i.ytimg.com/vi/TZA7eobPotM/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-32",
    title: "눈 마주치면 죽는다",
    image: "https://i.ytimg.com/vi/MkQtaqgUIHg/maxresdefault.jpg",
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
    id: "baseball-funny",
    playId: "baseball",
    category: "BASEBALL",
    title: "야구 웃긴짤 월드컵",
    round: "8강",
    description: "가장 웃긴 야구 짤을 골라보세요.",
    leftImage: BASEBALL_FUNNY_CANDIDATES[0].image,
    rightImage: BASEBALL_FUNNY_CANDIDATES[1].image,
    candidates: BASEBALL_FUNNY_CANDIDATES,
  },
  {
    id: "baseball-situation",
    playId: "baseball",
    category: "BASEBALL",
    title: "야구 보면서 가장 짜증나는 상황 월드컵",
    round: "8강",
    description: "야구를 볼 때 가장 참기 힘든 순간을 골라보세요.",
    leftImage: BASEBALL_SITUATION_CANDIDATES[0].image,
    rightImage: BASEBALL_SITUATION_CANDIDATES[1].image,
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
    round: "32강",
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
