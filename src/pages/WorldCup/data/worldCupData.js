import { FEATURED_TEAMS } from "../../Teams/data/teams";

const createTeamCandidates = (teams, leagueName) =>
  teams.map((team) => ({
    id: team.id,
    title: team.name,
    description: `${leagueName} · ${team.home}`,
    image: team.logo,
  }));

const createPlayerCandidates = (teams, leagueName) =>
  teams.flatMap((team) =>
    team.members.map((player) => ({
      id: player.id,
      title: player.name,
      description: `${team.name || leagueName} · ${player.role || "선수"}`,
      image: player.photo || "",
    })),
  );

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

// 팀 / 선수
const KBO_TEAMS = FEATURED_TEAMS.filter((team) => team.league === "kbo");
const KBO_TEAM_CANDIDATES = createTeamCandidates(KBO_TEAMS, "KBO");
const KBO_PLAYER_CANDIDATES = createPlayerCandidates(KBO_TEAMS, "KBO");

// SOCCER
// Teams 데이터 기반 K리그 팀 / 선수
const KLEAGUE_TEAMS = FEATURED_TEAMS.filter(
  (team) => team.league === "kleague",
);
const KLEAGUE_TEAM_CANDIDATES = createTeamCandidates(KLEAGUE_TEAMS, "K리그");
const KLEAGUE_PLAYER_CANDIDATES = createPlayerCandidates(
  KLEAGUE_TEAMS,
  "K리그",
);

// 현역 축구선수 실력 월드컵
const SOCCER_PLAYER_SKILL_CANDIDATES = [
  {
    id: "soccer-skill-01",
    title: "리오넬 메시",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/41d2ba82015a8f4f39b82d39dfed8f82.jpg",
  },
  {
    id: "soccer-skill-02",
    title: "손흥민",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/5d81d1691e88311c75a36db135e0d9c8.jpg",
  },
  {
    id: "soccer-skill-03",
    title: "킬리안 음바페",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/b9f66f2a4cf9c425f1f14f20f84e519a.jpg",
  },
  {
    id: "soccer-skill-04",
    title: "크리스티아누 호날두",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/ef86d95c81e3e8a6a10286fb30c0cf78.jpg",
  },
  {
    id: "soccer-skill-05",
    title: "엘링 홀란드",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/52f63ddec3a9a7c0f60c192626f7ef03.jpg",
  },
  {
    id: "soccer-skill-06",
    title: "케빈 더브라위너",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/ebd0278698cb6a65cc5d6e63114a543b.jpg",
  },
  {
    id: "soccer-skill-07",
    title: "네이마르 주니오르",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/6bee78bb15f17dd5554439b9d3404c68.jpg",
  },
  {
    id: "soccer-skill-08",
    title: "로베르트 레반도프스키",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/bc70584522cff89cc3c9927b48b1e409.jpg",
  },
  {
    id: "soccer-skill-09",
    title: "해리 케인",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/cf08946b77ff6cc54ccd2b0da0ac805c.jpg",
  },
  {
    id: "soccer-skill-10",
    title: "카림 벤제마",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/81679d8d5d02696c892cb2e2601cfdf3.jpg",
  },
  {
    id: "soccer-skill-11",
    title: "루카 모드리치",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/9c604db0687289f89f23dfe4e6348762.jpg",
  },
  {
    id: "soccer-skill-12",
    title: "주드 벨링엄",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/354d4e472166cfffa5953d9bc4c95c40.jpg",
  },
  {
    id: "soccer-skill-13",
    title: "모하메드 살라",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/5c9028ea3e41a17f61309cb66343c740.jpg",
  },
  {
    id: "soccer-skill-14",
    title: "이강인",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/73dcfba2d0d080cdaa82a8d6827902fa.jpg",
  },
  {
    id: "soccer-skill-15",
    title: "김민재",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/274db43af0be43d445c0e17643e94cd5.jpg",
  },
  {
    id: "soccer-skill-16",
    title: "비니시우스 주니오르",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/5f59220ec9e17a1f30250e4ca7b94b6f.jpg",
  },
  {
    id: "soccer-skill-17",
    title: "버진 반데이크",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/9afcc6abdf482ed44bbf484335c98496.jpg",
  },
  {
    id: "soccer-skill-18",
    title: "로드리",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/fe211e5b57d70044de94074436d9679b.jpg",
  },
  {
    id: "soccer-skill-19",
    title: "황희찬",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/920430924d0eddf06e9af2121d1afbf9.jpg",
  },
  {
    id: "soccer-skill-20",
    title: "세르히오 라모스",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/f0d29c975aba4fe66cad1e62b6798978.jpg",
  },
  {
    id: "soccer-skill-21",
    title: "마누엘 노이어",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/51c47ac24036ae2518d1aac6ee674a71.jpg",
  },
  {
    id: "soccer-skill-22",
    title: "루이스 수아레스",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/78365651fc5173731fb4b7859e120984.jpg",
  },
  {
    id: "soccer-skill-23",
    title: "앙투안 그리즈만",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/fba2b42d358343e9d01482c3ecd96edb.jpg",
  },
  {
    id: "soccer-skill-24",
    title: "필 포든",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/3bee5f54962c21b5bf29c506e0672243.jpg",
  },
  {
    id: "soccer-skill-25",
    title: "티보 쿠르투아",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/d410672dd2545a1dcfc969a9e603bea1.jpg",
  },
  {
    id: "soccer-skill-26",
    title: "후벵 디아스",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/f34ab87e78d2d2e749db91836b4ad89e.jpg",
  },
  {
    id: "soccer-skill-27",
    title: "토마스 뮐러",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/5e69f3aa3bc3bdd47ddef0408ce6cb2a.jpg",
  },
  {
    id: "soccer-skill-28",
    title: "흐비차 크라바츠헬리아",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/bcb32242d08354f14a9fab34d2ff34f0.jpg",
  },
  {
    id: "soccer-skill-29",
    title: "기성용",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/4abcfd41592e7c4cdc5146eac91946f6.jpg",
  },
  {
    id: "soccer-skill-30",
    title: "브루노 페르난데스",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/c8a18643d791c141e32257620582fbb8.jpg",
  },
  {
    id: "soccer-skill-31",
    title: "히샬리송",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/fe594945be111f46149042195e162bdb.jpg",
  },
  {
    id: "soccer-skill-32",
    title: "페드리",
    image:
      "https://img.piku.co.kr/w/uploads/32SsR2/9583687ba55a05d001e69ac095a1e7cf.jpg",
  },
];

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
const LCK_TEAMS = FEATURED_TEAMS.filter((team) => team.league === "lck");
const LCK_TEAM_CANDIDATES = [
  {
    id: "lck-team-t1",
    title: "T1",
    image:
      "https://i.ytimg.com/vi/2jq4g8OPftA/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBWbn1vQ577noO8iIAG-6cV0dzC3g",
  },
  {
    id: "lck-team-nongshim",
    title: "농심 레드포스",
    image:
      "https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/514dfe322927a585bb91dae0aa98ab781fc80d04-3840x2160.jpg?accountingTag=lol_esports",
  },
  {
    id: "lck-team-gen-g",
    title: "젠지",
    image: "https://i.ytimg.com/vi/N9TonXlw204/hqdefault.jpg",
  },
  {
    id: "lck-team-hanwha-life",
    title: "한화생명",
    image: "https://i.ytimg.com/vi/g1s64U1z1Lo/hqdefault.jpg",
  },
  {
    id: "lck-team-kt-rolster",
    title: "KT Rolster",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSM12a-RmIy4G_n3O3k0VVsgy2XZP8JV3eqpMCPwtuGcBqBd6p_KdRt51I&s=10",
  },
  {
    id: "lck-team-dplus-kia",
    title: "Dplus KIA",
    image:
      "https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/4e65732f94971d0c8c6c754a89832f06e65dcbb0-3840x2160.jpg?accountingTag=lol_esports",
  },
  {
    id: "lck-team-kiwoom-drx",
    title: "Kiwoom DRX",
    image:
      "https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/6b8504ae1abbbbad863653780d1889227ccbff5a-3840x2160.jpg?accountingTag=lol_esports",
  },
  {
    id: "lck-team-dn-soopers",
    title: "DN SOOPers",
    image:
      "https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/4c979c7127b889f73a17de00788d4ec3206f7f43-3840x2160.jpg?accountingTag=lol_esports",
  },
  {
    id: "lck-team-hajin-brion",
    title: "HAJIN BRION",
    image:
      "https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/5d76a1b2f8bf73546ce697c0c1fd63b0b2706cf1-3840x2160.jpg?accountingTag=lol_esports",
  },
  {
    id: "lck-team-bnk-fearx",
    title: "BNK FEARX",
    image:
      "https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/741d37b668cf75a5b9742958aae887f16ed6a85d-3840x2160.jpg?accountingTag=lol_esports",
  },
];

const LCK_PLAYER_CANDIDATES = createPlayerCandidates(LCK_TEAMS, "LCK");

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
    round: "64강",
    description: "실력과 매력을 모두 갖춘 최애 선수를 찾아보세요.",
    leftImage: KBO_PLAYER_CANDIDATES[0].image,
    rightImage: KBO_PLAYER_CANDIDATES[1].image,
    candidates: KBO_PLAYER_CANDIDATES,
  },

  // SOCCER
  {
    id: "soccer-player-skill",
    playId: "soccer",
    category: "SOCCER",
    title: "현역 축구선수 실력 월드컵",
    round: "32강",
    description: "오직 실력만 보고 최고의 현역 축구선수를 골라보세요.",
    leftImage: SOCCER_PLAYER_SKILL_CANDIDATES[0].image,
    rightImage: SOCCER_PLAYER_SKILL_CANDIDATES[1].image,
    candidates: SOCCER_PLAYER_SKILL_CANDIDATES,
  },
  {
    id: "soccer-team",
    playId: "soccer",
    category: "SOCCER",
    title: "K리그 최애 팀",
    round: "16강",
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
    round: "64강",
    description: "K리그 선수 중 나만의 최애 선수를 골라보세요.",
    leftImage: KLEAGUE_PLAYER_CANDIDATES[0].image,
    rightImage: KLEAGUE_PLAYER_CANDIDATES[1].image,
    candidates: KLEAGUE_PLAYER_CANDIDATES,
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
    round: "64강",
    description: "플레이와 매력을 비교해 최애 선수를 찾아보세요.",
    leftImage: LCK_PLAYER_CANDIDATES[0].image,
    rightImage: LCK_PLAYER_CANDIDATES[1].image,
    candidates: LCK_PLAYER_CANDIDATES,
  },
];

export const getWorldCupById = (worldCupId) =>
  WORLD_CUPS.find((worldCup) => worldCup.id === worldCupId);
