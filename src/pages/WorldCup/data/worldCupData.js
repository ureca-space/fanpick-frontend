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
const SOCCER_PLAYER_SKILL_IMAGES = {
  "soccer-skill-01":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Leo_Messi_Argentina_v_Egypt_7_July_2026-1.jpg/960px-Leo_Messi_Argentina_v_Egypt_7_July_2026-1.jpg",
  "soccer-skill-02":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/BFA_2023_-2_Heung-Min_Son_%28cropped%29.jpg/960px-BFA_2023_-2_Heung-Min_Son_%28cropped%29.jpg",
  "soccer-skill-03":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Kylian_Mbappe_France_v_Senegal_16_June_2026-391_%28cropped%29.jpg/960px-Kylian_Mbappe_France_v_Senegal_16_June_2026-391_%28cropped%29.jpg",
  "soccer-skill-04":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Cristiano_Ronaldo_Croatia_v_Portugal_2_July_2026-075_%28cropped%29.jpg/960px-Cristiano_Ronaldo_Croatia_v_Portugal_2_July_2026-075_%28cropped%29.jpg",
  "soccer-skill-05":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Erling_Haaland_Morocco_v_Norway_7_June_2026-51.jpg/960px-Erling_Haaland_Morocco_v_Norway_7_June_2026-51.jpg",
  "soccer-skill-06":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_%28cropped%29.jpg/960px-Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_%28cropped%29.jpg",
  "soccer-skill-07":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Neymar_Junior_Brazil_V_Morocco_13_June_2026-40.jpg/960px-Neymar_Junior_Brazil_V_Morocco_13_June_2026-40.jpg",
  "soccer-skill-08":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/2019147183134_2019-05-27_Fussball_1.FC_Kaiserslautern_vs_FC_Bayern_M%C3%BCnchen_-_Sven_-_1D_X_MK_II_-_0228_-_B70I8527_%28cropped%29.jpg/960px-2019147183134_2019-05-27_Fussball_1.FC_Kaiserslautern_vs_FC_Bayern_M%C3%BCnchen_-_Sven_-_1D_X_MK_II_-_0228_-_B70I8527_%28cropped%29.jpg",
  "soccer-skill-09":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Harry_Kane_England_v_Ghana_23_June_2026-219_%28cropped%29.jpg/960px-Harry_Kane_England_v_Ghana_23_June_2026-219_%28cropped%29.jpg",
  "soccer-skill-10":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Karim_Benzema_Pick.jpg/960px-Karim_Benzema_Pick.jpg",
  "soccer-skill-11":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Luka_Modric_Croatia_v_Portugal_2_July_2026-055.jpg/960px-Luka_Modric_Croatia_v_Portugal_2_July_2026-055.jpg",
  "soccer-skill-12":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Jude_Bellingham_England_v_Panama_27_June_26-160_%28cropped%29.jpg/960px-Jude_Bellingham_England_v_Panama_27_June_26-160_%28cropped%29.jpg",
  "soccer-skill-13":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Mohamed_Salah_Argentina_v_Egypt_7_July_2026-163_%28cropped%29.jpg/960px-Mohamed_Salah_Argentina_v_Egypt_7_July_2026-163_%28cropped%29.jpg",
  "soccer-skill-14":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Lee_Kang-in_-_2022_%2852551771501%29_%28cropped%29.jpg/960px-Lee_Kang-in_-_2022_%2852551771501%29_%28cropped%29.jpg",
  "soccer-skill-15":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/FC_Red_Bull_Salzburg_gegen_Bayern_M%C3%BCnchen_%282025-01-06_Testspiel%29_26.jpg/960px-FC_Red_Bull_Salzburg_gegen_Bayern_M%C3%BCnchen_%282025-01-06_Testspiel%29_26.jpg",
  "soccer-skill-16":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Vin%C3%ADcius_J%C3%BAnior_Brazil_V_Morocco_13_June_2026-207_%28cropped%29.jpg/960px-Vin%C3%ADcius_J%C3%BAnior_Brazil_V_Morocco_13_June_2026-207_%28cropped%29.jpg",
  "soccer-skill-17":
    "https://upload.wikimedia.org/wikipedia/commons/5/5d/20160604_AUT_NED_8876_%28cropped%29.jpg",
  "soccer-skill-18":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Rodri_Argentina_v_Spain_19_July_2026-187_%28cropped%29.jpg/960px-Rodri_Argentina_v_Spain_19_July_2026-187_%28cropped%29.jpg",
  "soccer-skill-19":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/240622_%ED%99%A9%ED%9D%AC%EC%B0%AC_%ED%92%8B%EB%B3%BC_%ED%8E%98%EC%8A%A4%ED%8B%B0%EB%B2%8C.jpg/960px-240622_%ED%99%A9%ED%9D%AC%EC%B0%AC_%ED%92%8B%EB%B3%BC_%ED%8E%98%EC%8A%A4%ED%8B%B0%EB%B2%8C.jpg",
  "soccer-skill-20":
    "https://upload.wikimedia.org/wikipedia/commons/4/4b/Sergio_Ramos_Interview_2021_%28cropped%29.jpg",
  "soccer-skill-21":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Manuel_Neuer_Ecuador_v_Germany_25_June_2026-148.jpg/960px-Manuel_Neuer_Ecuador_v_Germany_25_June_2026-148.jpg",
  "soccer-skill-22":
    "https://upload.wikimedia.org/wikipedia/commons/f/f7/Luis_Su%C3%A1rez_2026_%28cropped%29.jpg",
  "soccer-skill-23":
    "https://upload.wikimedia.org/wikipedia/commons/6/6e/FRA-ARG_%2810%29_%28cropped%29.jpg",
  "soccer-skill-24":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_1DX_2613%2C_Phil_Foden.jpg/960px-2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_1DX_2613%2C_Phil_Foden.jpg",
  "soccer-skill-25":
    "https://upload.wikimedia.org/wikipedia/commons/f/f7/Thibaut_Courtois_at_the_2018_World_Cup_%28cropped%29.jpg",
  "soccer-skill-26":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Diogo_Costa_Ruben_Dias_Croatia_v_Portugal_2_July_2026-181_%28cropped%29.jpg/960px-Diogo_Costa_Ruben_Dias_Croatia_v_Portugal_2_July_2026-181_%28cropped%29.jpg",
  "soccer-skill-27":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/FC_Red_Bull_Salzburg_gegen_Bayern_M%C3%BCnchen_%282025-01-06_Testspiel%29_19.jpg/960px-FC_Red_Bull_Salzburg_gegen_Bayern_M%C3%BCnchen_%282025-01-06_Testspiel%29_19.jpg",
  "soccer-skill-28":
    "https://upload.wikimedia.org/wikipedia/commons/4/4a/Kvaratskhelia_asse_psg_2425.png",
  "soccer-skill-29":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/240609_FC_%EC%84%9C%EC%9A%B8_%ED%8C%AC%EC%82%AC%EC%9D%B8%ED%9A%8C_%28%EA%B8%B0%EC%84%B1%EC%9A%A9%29.jpg/960px-240609_FC_%EC%84%9C%EC%9A%B8_%ED%8C%AC%EC%82%AC%EC%9D%B8%ED%9A%8C_%28%EA%B8%B0%EC%84%B1%EC%9A%A9%29.jpg",
  "soccer-skill-30":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Bruno_Fernandes_USMNT_v_Portugal_Mar_31_2026-27_%28cropped%29.jpg/960px-Bruno_Fernandes_USMNT_v_Portugal_Mar_31_2026-27_%28cropped%29.jpg",
  "soccer-skill-31":
    "https://upload.wikimedia.org/wikipedia/commons/7/7a/Richarlison_%C3%A9_homenageado_na_ALES_%2810.July.2019%29_08_%28cropped%29.jpg",
  "soccer-skill-32":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Pedri_France_v_Spain_7.24.26-245.jpg/960px-Pedri_France_v_Spain_7.24.26-245.jpg",
};

const SOCCER_PLAYER_SKILL_CANDIDATES = [
  {
    id: "soccer-skill-01",
    title: "리오넬 메시",
  },
  {
    id: "soccer-skill-02",
    title: "손흥민",
  },
  {
    id: "soccer-skill-03",
    title: "킬리안 음바페",
  },
  {
    id: "soccer-skill-04",
    title: "크리스티아누 호날두",
  },
  {
    id: "soccer-skill-05",
    title: "엘링 홀란드",
  },
  {
    id: "soccer-skill-06",
    title: "케빈 더브라위너",
  },
  {
    id: "soccer-skill-07",
    title: "네이마르 주니오르",
  },
  {
    id: "soccer-skill-08",
    title: "로베르트 레반도프스키",
  },
  {
    id: "soccer-skill-09",
    title: "해리 케인",
  },
  {
    id: "soccer-skill-10",
    title: "카림 벤제마",
  },
  {
    id: "soccer-skill-11",
    title: "루카 모드리치",
  },
  {
    id: "soccer-skill-12",
    title: "주드 벨링엄",
  },
  {
    id: "soccer-skill-13",
    title: "모하메드 살라",
  },
  {
    id: "soccer-skill-14",
    title: "이강인",
  },
  {
    id: "soccer-skill-15",
    title: "김민재",
  },
  {
    id: "soccer-skill-16",
    title: "비니시우스 주니오르",
  },
  {
    id: "soccer-skill-17",
    title: "버진 반데이크",
  },
  {
    id: "soccer-skill-18",
    title: "로드리",
  },
  {
    id: "soccer-skill-19",
    title: "황희찬",
  },
  {
    id: "soccer-skill-20",
    title: "세르히오 라모스",
  },
  {
    id: "soccer-skill-21",
    title: "마누엘 노이어",
  },
  {
    id: "soccer-skill-22",
    title: "루이스 수아레스",
  },
  {
    id: "soccer-skill-23",
    title: "앙투안 그리즈만",
  },
  {
    id: "soccer-skill-24",
    title: "필 포든",
  },
  {
    id: "soccer-skill-25",
    title: "티보 쿠르투아",
  },
  {
    id: "soccer-skill-26",
    title: "후벵 디아스",
  },
  {
    id: "soccer-skill-27",
    title: "토마스 뮐러",
  },
  {
    id: "soccer-skill-28",
    title: "흐비차 크라바츠헬리아",
  },
  {
    id: "soccer-skill-29",
    title: "기성용",
  },
  {
    id: "soccer-skill-30",
    title: "브루노 페르난데스",
  },
  {
    id: "soccer-skill-31",
    title: "히샬리송",
  },
  {
    id: "soccer-skill-32",
    title: "페드리",
  },
].map((candidate) => ({
  ...candidate,
  image: SOCCER_PLAYER_SKILL_IMAGES[candidate.id] || candidate.image,
}));

// LOL
// LCK 썸네일 이상형 월드컵
const LCK_THUMBNAIL_CANDIDATES = [
  {
    id: "lck-thumbnail-01",
    title: "룰 윅",
    image: "https://i.ytimg.com/vi/1UvgYTgtHp8/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-02",
    title: "탕탕! 후루후루",
    image: "https://i.ytimg.com/vi/7QedYnis5ns/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-03",
    title: "한화둘셋 야!!!! 천방지축 어리둥절 빙글빙글 돌아가는~",
    image: "https://i.ytimg.com/vi/wFPQCG9I5bE/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-04",
    title: "뽀삐넛",
    image: "https://i.ytimg.com/vi/rTV3g5hvhUI/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-05",
    title: "-이민형 단편시 ‘바텀 갱’ 中에서-",
    image: "https://i.ytimg.com/vi/xekWAF9SZp0/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-06",
    title: "피했죠?",
    image: "https://i.ytimg.com/vi/uxd9nlRDuFc/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-07",
    title: "축하해주라 나 장학금 받아",
    image: "https://i.ytimg.com/vi/OPRcsPeLTxE/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-08",
    title: "11년 전통 원조 맛집",
    image: "https://i.ytimg.com/vi/44KJYSfMszc/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-09",
    title: "안심하라. 이것는 허위광고가 아닙니다!",
    image: "https://i.ytimg.com/vi/76NfIwFFPMA/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-10",
    title: "ㅈㄱㅊㅇ",
    image: "https://i.ytimg.com/vi/PzcLs0LrmnI/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-11",
    title: "룰골러스",
    image: "https://i.ytimg.com/vi/zzfpkM5tSSo/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-12",
    title: "AD Carry",
    image: "https://i.ytimg.com/vi/c7ZDQ7AysDc/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-13",
    title: "탱탱한 최우젤리",
    image: "https://i.ytimg.com/vi/cs88RI0RXwM/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-14",
    title: "The Last Mapogo-Derby",
    image: "https://i.ytimg.com/vi/Sv_NNDuA73I/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-15",
    title: "롤윤발과 시라카",
    image: "https://i.ytimg.com/vi/zezgYi0spm8/maxresdefault.jpg",
  },
  {
    id: "lck-thumbnail-16",
    title: "League of Legend",
    image: "https://i.ytimg.com/vi/NQAj0eF7XBE/maxresdefault.jpg",
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
    image: "https://i.ytimg.com/vi/hqYJoKlnbzs/maxresdefault.jpg",
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
  { id: "all", label: "ALL" },
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
