const KLEAGUE_LOGO_URL = "https://www.kleague.com/assets/images/emblem";
const KBO_PLAYER_IMAGE_URL =
  "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/person/middle/2026";
const KBO_PLAYER_DETAIL_URL = "https://www.koreabaseball.com";
const KLEAGUE_PLAYER_DETAIL_URL =
  "https://www.kleague.com/record/playerDetail.do?playerId=";

const TEAM_MATCH_CODES = {
  "kbo-doosan": ["DOOSAN"],
  "kbo-lg": ["LG"],
  "kbo-kia": ["KIA"],
  "kbo-samsung": ["SAMSUNG"],
  "kbo-lotte": ["LOTTE"],
  "kbo-hanwha": ["HANWHA"],
  "kbo-ssg": ["SSG"],
  "kbo-nc": ["NC"],
  "kbo-kt": ["KT"],
  "kbo-kiwoom": ["KIWOOM"],
  "kleague-ulsan": ["K01"],
  "kleague-jeonbuk": ["K05"],
  "kleague-seoul": ["K09"],
  "kleague-pohang": ["K03"],
  "kleague-daejeon": ["K10"],
  "kleague-jeju": ["K04"],
  "kleague-gangwon": ["K21"],
  "kleague-anyang": ["K27"],
  "kleague-incheon": ["K18"],
  "kleague-bucheon": ["K26"],
  "kleague-gimcheon": ["K35"],
  "kleague-gwangju": ["K22"],
  "lck-t1": ["T1"],
  "lck-gen": ["GEN"],
  "lck-hle": ["HLE"],
  "lck-dk": ["DK"],
  "lck-kt": ["KT"],
  "lck-krx": ["KRX"],
  "lck-ns": ["NS"],
  "lck-bfx": ["BFX"],
  "lck-dns": ["DNS"],
  "lck-bro": ["BRO"],
};

const TEAM_SPORT_BY_LEAGUE = {
  kbo: "baseball",
  kleague: "soccer",
  lck: "esports",
};

const PROFILE_PALETTES = [
  ["#e31b36", "#071a33"],
  ["#4568f0", "#101524"],
  ["#13a47a", "#111827"],
  ["#f2a024", "#1f2333"],
  ["#7a5cff", "#151923"],
];

const createRatings = (ratings) =>
  Object.entries(ratings).map(([label, score]) => ({
    label,
    score,
  }));

const createMemberPhoto = (team, member, index) => {
  const [primaryColor, secondaryColor] =
    PROFILE_PALETTES[index % PROFILE_PALETTES.length];

  const role = member.role.slice(0, 8);
  const teamLabel = team.shortName.slice(0, 10);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="480" height="560" viewBox="0 0 480 560">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="${primaryColor}" offset="0"/>
          <stop stop-color="${secondaryColor}" offset="1"/>
        </linearGradient>
        <radialGradient id="light" cx="42%" cy="24%" r="58%">
          <stop stop-color="#ffffff" stop-opacity=".34" offset="0"/>
          <stop stop-color="#ffffff" stop-opacity="0" offset="1"/>
        </radialGradient>
      </defs>
      <rect width="480" height="560" rx="42" fill="url(#bg)"/>
      <rect width="480" height="560" rx="42" fill="url(#light)"/>
      <circle cx="240" cy="194" r="92" fill="#ffffff" opacity=".88"/>
      <path d="M112 490c18-106 74-166 128-166s110 60 128 166" fill="#ffffff" opacity=".88"/>
      <path d="M80 90h320" stroke="#ffffff" stroke-opacity=".22" stroke-width="4"/>
      <path d="M80 470h320" stroke="#ffffff" stroke-opacity=".22" stroke-width="4"/>
      <text x="240" y="70" text-anchor="middle" fill="#ffffff" opacity=".72" font-size="26" font-weight="800" font-family="Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">${teamLabel}</text>
      <text x="240" y="535" text-anchor="middle" fill="#ffffff" font-size="34" font-weight="900" font-family="Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">${role}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const createMembers = (team) =>
  team.players.map((player, index) => ({
    ...player,
    id: `${team.id}-member-${index + 1}`,
    photo: createMemberPhoto(team, player, index),
  }));

const KBO_ROLE_NOTES = {
  투수: "마운드에서 경기 흐름을 잡는 장면을 먼저 보면 팀 색이 보입니다.",
  포수: "투수 리드와 경기 운영을 같이 따라가면 재미가 붙습니다.",
  내야수: "수비 위치 선정과 타선 연결을 함께 보는 포인트입니다.",
  외야수: "장타, 주루, 넓은 수비 범위를 한 번에 볼 수 있습니다.",
};

const KLEAGUE_ROLE_NOTES = {
  FW: "득점 장면과 전방 압박의 시작점을 같이 보면 좋습니다.",
  MF: "템포 조절, 전환 패스, 세컨볼 싸움이 입문 포인트입니다.",
  DF: "라인 컨트롤과 빌드업 시작을 따라가면 팀 축구가 보입니다.",
  GK: "큰 세이브와 후방 빌드업 선택을 보는 재미가 있습니다.",
};

const LCK_ROLE_NOTES = {
  TOP: "사이드 주도권과 한타 진입 각을 같이 보면 좋습니다.",
  JGL: "동선, 갱킹 타이밍, 오브젝트 설계를 따라가기 좋습니다.",
  JUNGLE: "동선, 갱킹 타이밍, 오브젝트 설계를 따라가기 좋습니다.",
  MID: "라인전 압박이 교전과 오브젝트로 이어지는 핵심 포지션입니다.",
  BOT: "후반 한타에서 포지셔닝과 딜각을 보는 재미가 큽니다.",
  ADC: "후반 한타에서 포지셔닝과 딜각을 보는 재미가 큽니다.",
  SUP: "시야 장악과 이니시 각을 열어 팀 흐름을 바꿉니다.",
  SPT: "시야 장악과 이니시 각을 열어 팀 흐름을 바꿉니다.",
};

const createKboMembers = (players) =>
  players.map(({ playerId, name, role, number, link, note }) => ({
    id: `kbo-${playerId}`,
    name,
    role: `${role} · No.${number}`,
    number,
    note: note || KBO_ROLE_NOTES[role] || "공식 선수 ID로 연결한 팀 멤버입니다.",
    photo: `${KBO_PLAYER_IMAGE_URL}/${playerId}.jpg`,
    sourceUrl: `${KBO_PLAYER_DETAIL_URL}${link}`,
  }));

const createKLeagueMembers = (players) =>
  players.map(({ playerId, name, role, number, photo, note }) => ({
    id: `kleague-${playerId}`,
    name,
    role: `${role} · No.${number}`,
    number,
    note:
      note || KLEAGUE_ROLE_NOTES[role] || "K리그 공식 프로필 이미지로 연결한 멤버입니다.",
    photo,
    sourceUrl: `${KLEAGUE_PLAYER_DETAIL_URL}${playerId}`,
  }));

const createLckMembers = (teamId, sourceUrl, players) =>
  players.map(({
    id,
    name,
    realName,
    role,
    photo,
    note,
    sourceUrl: playerSourceUrl,
  }, index) => ({
    id: `${teamId}-${id || index + 1}`,
    name,
    realName,
    role,
    note: note || LCK_ROLE_NOTES[role] || "팀 로스터에서 확인한 멤버입니다.",
    photo,
    sourceUrl: playerSourceUrl || sourceUrl,
  }));

const TEAM_MEMBERS_BY_ID = {
  "kbo-doosan": createKboMembers([
    {
      playerId: "77532",
      name: "손아섭",
      role: "외야수",
      number: "24",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=77532",
    },
    {
      playerId: "76232",
      name: "양의지",
      role: "포수",
      number: "25",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=76232",
    },
    {
      playerId: "79231",
      name: "정수빈",
      role: "외야수",
      number: "31",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=79231",
    },
    {
      playerId: "68220",
      name: "곽빈",
      role: "투수",
      number: "47",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=68220",
    },
    {
      playerId: "54263",
      name: "김택연",
      role: "투수",
      number: "63",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=54263",
    },
  ]),
  "kbo-lg": createKboMembers([
    {
      playerId: "79109",
      name: "오지환",
      role: "내야수",
      number: "10",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=79109",
    },
    {
      playerId: "66108",
      name: "홍창기",
      role: "외야수",
      number: "51",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=66108",
    },
    {
      playerId: "69102",
      name: "문보경",
      role: "내야수",
      number: "2",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=69102",
    },
    {
      playerId: "79365",
      name: "박동원",
      role: "포수",
      number: "27",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=79365",
    },
    {
      playerId: "61101",
      name: "임찬규",
      role: "투수",
      number: "1",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=61101",
    },
  ]),
  "kbo-kia": createKboMembers([
    {
      playerId: "52605",
      name: "김도영",
      role: "내야수",
      number: "5",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=52605",
    },
    {
      playerId: "77637",
      name: "양현종",
      role: "투수",
      number: "54",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=77637",
    },
    {
      playerId: "62947",
      name: "나성범",
      role: "외야수",
      number: "47",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=62947",
    },
    {
      playerId: "50662",
      name: "정해영",
      role: "투수",
      number: "62",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=50662",
    },
    {
      playerId: "78603",
      name: "김선빈",
      role: "내야수",
      number: "3",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=78603",
    },
  ]),
  "kbo-samsung": createKboMembers([
    {
      playerId: "62404",
      name: "구자욱",
      role: "외야수",
      number: "5",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=62404",
    },
    {
      playerId: "69446",
      name: "원태인",
      role: "투수",
      number: "18",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=69446",
    },
    {
      playerId: "50458",
      name: "김지찬",
      role: "외야수",
      number: "58",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=50458",
    },
    {
      playerId: "52415",
      name: "이재현",
      role: "내야수",
      number: "7",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=52415",
    },
    {
      playerId: "74540",
      name: "강민호",
      role: "포수",
      number: "47",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=74540",
    },
  ]),
  "kbo-lotte": createKboMembers([
    {
      playerId: "78513",
      name: "전준우",
      role: "외야수",
      number: "8",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=78513",
    },
    {
      playerId: "52591",
      name: "윤동희",
      role: "외야수",
      number: "91",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=52591",
    },
    {
      playerId: "69517",
      name: "고승민",
      role: "내야수",
      number: "2",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=69517",
    },
    {
      playerId: "64021",
      name: "박세웅",
      role: "투수",
      number: "21",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=64021",
    },
    {
      playerId: "62528",
      name: "김원중",
      role: "투수",
      number: "34",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=62528",
    },
  ]),
  "kbo-hanwha": createKboMembers([
    {
      playerId: "76715",
      name: "류현진",
      role: "투수",
      number: "99",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=76715",
    },
    {
      playerId: "69737",
      name: "노시환",
      role: "내야수",
      number: "8",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=69737",
    },
    {
      playerId: "53764",
      name: "문현빈",
      role: "외야수",
      number: "51",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=53764",
    },
    {
      playerId: "68050",
      name: "강백호",
      role: "내야수",
      number: "50",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=68050",
    },
    {
      playerId: "53754",
      name: "김서현",
      role: "투수",
      number: "44",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=53754",
    },
  ]),
  "kbo-ssg": createKboMembers([
    {
      playerId: "75847",
      name: "최정",
      role: "내야수",
      number: "14",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=75847",
    },
    {
      playerId: "67893",
      name: "박성한",
      role: "내야수",
      number: "2",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=67893",
    },
    {
      playerId: "50854",
      name: "최지훈",
      role: "외야수",
      number: "54",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=50854",
    },
    {
      playerId: "77829",
      name: "김광현",
      role: "투수",
      number: "29",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=77829",
    },
    {
      playerId: "53827",
      name: "에레디아",
      role: "외야수",
      number: "27",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=53827",
    },
  ]),
  "kbo-nc": createKboMembers([
    {
      playerId: "79215",
      name: "박건우",
      role: "외야수",
      number: "37",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=79215",
    },
    {
      playerId: "62907",
      name: "박민우",
      role: "내야수",
      number: "2",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=62907",
    },
    {
      playerId: "51907",
      name: "김주원",
      role: "내야수",
      number: "7",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=51907",
    },
    {
      playerId: "65933",
      name: "구창모",
      role: "투수",
      number: "59",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=65933",
    },
    {
      playerId: "68912",
      name: "김형준",
      role: "포수",
      number: "25",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=68912",
    },
  ]),
  "kbo-kt": createKboMembers([
    {
      playerId: "64001",
      name: "고영표",
      role: "투수",
      number: "1",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=64001",
    },
    {
      playerId: "50030",
      name: "소형준",
      role: "투수",
      number: "30",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=50030",
    },
    {
      playerId: "78548",
      name: "장성우",
      role: "포수",
      number: "22",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=78548",
    },
    {
      playerId: "79402",
      name: "김상수",
      role: "내야수",
      number: "7",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=79402",
    },
    {
      playerId: "52060",
      name: "박영현",
      role: "투수",
      number: "60",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=52060",
    },
  ]),
  "kbo-kiwoom": createKboMembers([
    {
      playerId: "51302",
      name: "이주형",
      role: "내야수",
      number: "58",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=51302",
    },
    {
      playerId: "53312",
      name: "김건희",
      role: "포수",
      number: "12",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=53312",
    },
    {
      playerId: "64346",
      name: "임병욱",
      role: "외야수",
      number: "17",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=64346",
    },
    {
      playerId: "64984",
      name: "김태진",
      role: "내야수",
      number: "1",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=64984",
    },
    {
      playerId: "54319",
      name: "김윤하",
      role: "투수",
      number: "19",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=54319",
    },
  ]),
  "kleague-ulsan": createKLeagueMembers([
    {
      playerId: "20170095",
      name: "MARCOS",
      role: "FW",
      number: "9",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K01/player_20170095.png",
    },
    {
      playerId: "20240330",
      name: "Woo PARK",
      role: "MF",
      number: "16",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K02/player_20240330.png",
    },
    {
      playerId: "20140033",
      name: "Sangwoo",
      role: "DF",
      number: "17",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K01/player_20140033.png",
    },
    {
      playerId: "20250023",
      name: "Seongmin RYU",
      role: "GK",
      number: "13",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K01/player_20250023.png",
    },
  ]),
  "kleague-jeonbuk": createKLeagueMembers([
    {
      playerId: "20250077",
      name: "Hyeon KANG",
      role: "FW",
      number: "39",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K05/player_20250077.png",
    },
    {
      playerId: "20250353",
      name: "JOAO PEDRO DA COSTA GAMBOA",
      role: "MF",
      number: "16",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K05/player_20250353.png",
    },
    {
      playerId: "20140143",
      name: "YOUNGBIN",
      role: "DF",
      number: "2",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K05/player_20140143.png",
    },
    {
      playerId: "20230256",
      name: "Sihyeon GONG",
      role: "GK",
      number: "29",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K05/player_20230256.png",
    },
  ]),
  "kleague-seoul": createKLeagueMembers([
    {
      playerId: "20170229",
      name: "SeonMin",
      role: "FW",
      number: "27",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K09/player_20170229.png",
    },
    {
      playerId: "20260047",
      name: "Pilgwan KO",
      role: "MF",
      number: "23",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K09/player_20260047.png",
    },
    {
      playerId: "20250060",
      name: "Jeewoon KIM",
      role: "DF",
      number: "36",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K09/player_20250060.png",
    },
    {
      playerId: "20140038",
      name: "HYEONMU KANG",
      role: "GK",
      number: "31",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K09/player_20140038.png",
    },
  ]),
  "kleague-pohang": createKLeagueMembers([
    {
      playerId: "20260023",
      name: "Yonghak",
      role: "FW",
      number: "30",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K03/player_20260023.png",
    },
    {
      playerId: "20060073",
      name: "Sungyueng",
      role: "MF",
      number: "40",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K03/player_20060073.png",
    },
    {
      playerId: "20250015",
      name: "Minjun KANG",
      role: "DF",
      number: "13",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K03/player_20250015.png",
    },
    {
      playerId: "20240061",
      name: "Kang Seong-Hyeok",
      role: "GK",
      number: "41",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2024/K03/player_20240061.png",
    },
  ]),
  "kleague-daejeon": createKLeagueMembers([
    {
      playerId: "20260062",
      name: "Diogo DE OLIVEIRA BARBOSA",
      role: "FW",
      number: "9",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K10/player_20260062.png",
    },
    {
      playerId: "20230014",
      name: "gyeonghwan KIM",
      role: "MF",
      number: "16",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2024/K10/player_20230014.png",
    },
    {
      playerId: "20240115",
      name: "Kang Seong-Yun",
      role: "DF",
      number: "23",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2024/K10/player_20240115.png",
    },
    {
      playerId: "20240116",
      name: "minsoo KIM",
      role: "GK",
      number: "31",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K10/player_20240116.png",
    },
  ]),
  "kleague-jeju": createKLeagueMembers([
    {
      playerId: "20220166",
      name: "Sinjin KIM",
      role: "FW",
      number: "18",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K09/player_20220166.png",
    },
    {
      playerId: "20130108",
      name: "CHANGHOON KWON",
      role: "MF",
      number: "22",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K05/player_20130108.png",
    },
    {
      playerId: "20210165",
      name: "Ryunseong KIM",
      role: "DF",
      number: "40",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K04/player_20210165.png",
    },
    {
      playerId: "20160156",
      name: "KIM",
      role: "GK",
      number: "1",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K04/player_20160156.png",
    },
  ]),
  "kleague-gangwon": createKLeagueMembers([
    {
      playerId: "20160113",
      name: "Gunhee",
      role: "FW",
      number: "9",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K21/player_20160113.png",
    },
    {
      playerId: "20210192",
      name: "Yungu KANG",
      role: "MF",
      number: "14",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K21/player_20210192.png",
    },
    {
      playerId: "20230270",
      name: "Junhyuk KANG",
      role: "DF",
      number: "99",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K21/player_20230270.png",
    },
    {
      playerId: "20240099",
      name: "Yoosung KIM",
      role: "GK",
      number: "41",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K21/player_20240099.png",
    },
  ]),
  "kleague-anyang": createKLeagueMembers([
    {
      playerId: "20240078",
      name: "마테우스",
      role: "MF",
      number: "7",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/663e47fc-17cd-4a1d-b863-36ec62bc805b.png",
    },
    {
      playerId: "20260091",
      name: "아일톤",
      role: "FW",
      number: "11",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/ce45282e-b793-4536-b722-8fdb29267922.png",
    },
    {
      playerId: "20200170",
      name: "최건주",
      role: "FW",
      number: "27",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/0fbf772b-5e9a-4c18-b720-06c3f02db368.png",
    },
    {
      playerId: "20240084",
      name: "김운",
      role: "FW",
      number: "19",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/70add80c-b98b-4790-86d8-30695714f9f7.png",
    },
  ]),
  "kleague-incheon": createKLeagueMembers([
    {
      playerId: "20180196",
      name: "무고사",
      role: "FW",
      number: "9",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/ec17f023-90b0-4b12-b8b7-cabbf17bbac0.png",
    },
    {
      playerId: "20260168",
      name: "페리어",
      role: "FW",
      number: "99",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/2e1c239d-0236-49b6-a684-168bbfb281a6.png",
    },
    {
      playerId: "20210223",
      name: "제르소",
      role: "MF",
      number: "11",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/25a15ab0-b311-49e3-9d00-eb281143fb81.png",
    },
    {
      playerId: "20190131",
      name: "이동률",
      role: "FW",
      number: "10",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/e6e15ba3-f217-490c-8e33-b8c254b7eaac.png",
    },
  ]),
  "kleague-bucheon": createKLeagueMembers([
    {
      playerId: "20220353",
      name: "갈레고",
      role: "FW",
      number: "11",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/69e85310-2d02-4a19-9359-6ef37fdfde7a.png",
    },
    {
      playerId: "20230333",
      name: "가브리엘",
      role: "FW",
      number: "63",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/d79be906-a876-47b1-a01a-f8f18b26af68.png",
    },
  ]),
  "kleague-gimcheon": createKLeagueMembers([
    {
      playerId: "20180123",
      name: "고재현",
      role: "FW",
      number: "7",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/24b78ec7-0ab3-4f3c-87f2-85b98814588e.png",
    },
    {
      playerId: "20200164",
      name: "이건희",
      role: "FW",
      number: "9",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/f1667337-1899-4256-b43b-6cb489f85753.png",
    },
    {
      playerId: "20230103",
      name: "김주찬",
      role: "FW",
      number: "17",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/6ad12b00-e642-41f4-b844-8eb97334dae7.png",
    },
    {
      playerId: "20220139",
      name: "박철우",
      role: "DF",
      number: "3",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/d566158c-6d37-4a71-8a44-dca440512ecf.png",
    },
  ]),
  "kleague-gwangju": createKLeagueMembers([
    {
      playerId: "20240210",
      name: "문민서",
      role: "MF",
      number: "88",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/437e8875-eb68-4ca5-be39-7107bb4a2fed.png",
    },
    {
      playerId: "20140134",
      name: "신창무",
      role: "FW",
      number: "40",
      photo:
        "https://ssl.pstatic.net/sstatic/people/profileImg/t/aa6fe3ff-4fa6-444f-b900-af9f6292305a.png",
    },
  ]),
  "lck-t1": createLckMembers("lck-t1", "https://www.t1.gg/teams/leagueoflegends", [
    {
      id: "doran",
      name: "Doran",
      realName: "최현준",
      role: "TOP",
      photo:
        "https://images.squarespace-cdn.com/content/v1/62d09f54a49d6f1c78455cce/0aef0418-a156-44be-809e-ea3bc14f6def/Doran.png",
    },
    {
      id: "oner",
      name: "Oner",
      realName: "문현준",
      role: "JGL",
      photo:
        "https://images.squarespace-cdn.com/content/v1/62d09f54a49d6f1c78455cce/4f17e9d7-e7aa-4b43-b2a6-9fb833a83821/Oner.png",
    },
    {
      id: "faker",
      name: "Faker",
      realName: "이상혁",
      role: "MID",
      photo:
        "https://images.squarespace-cdn.com/content/v1/62d09f54a49d6f1c78455cce/de78a12c-0ffc-41e4-801c-0de20505b509/Faker.png",
    },
    {
      id: "peyz",
      name: "Peyz",
      realName: "김수환",
      role: "BOT",
      photo:
        "https://images.squarespace-cdn.com/content/v1/62d09f54a49d6f1c78455cce/c80912d5-e20e-4ab3-a7bc-74f3eea16931/peyz.jpg",
    },
    {
      id: "keria",
      name: "Keria",
      realName: "류민석",
      role: "SPT",
      photo:
        "https://images.squarespace-cdn.com/content/v1/62d09f54a49d6f1c78455cce/cbc62645-f9f4-464c-9ee2-8620de9b3c32/Keria.png",
    },
  ]),
  "lck-gen": createLckMembers("lck-gen", "https://geng.gg/pages/league-of-legends", [
    {
      id: "kiin",
      name: "Kiin",
      realName: "김기인",
      role: "TOP",
      photo:
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/6/65/GEN_Kiin_2026_Split_1.png/revision/latest?cb=20260122171304",
      sourceUrl: "https://lol.fandom.com/wiki/Kiin",
    },
    {
      id: "canyon",
      name: "Canyon",
      realName: "김건부",
      role: "JGL",
      photo:
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/5/55/GEN_Canyon_2026_Split_1.png/revision/latest?cb=20260122171322",
      sourceUrl: "https://lol.fandom.com/wiki/Canyon",
    },
    {
      id: "chovy",
      name: "Chovy",
      realName: "정지훈",
      role: "MID",
      photo:
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/b/b3/GEN_Chovy_2026_Split_1.png/revision/latest?cb=20260122171212",
      sourceUrl: "https://lol.fandom.com/wiki/Chovy",
    },
    {
      id: "ruler",
      name: "Ruler",
      realName: "박재혁",
      role: "BOT",
      photo:
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/e/e3/GEN_Ruler_2026_Split_1.png/revision/latest?cb=20260122171312",
      sourceUrl: "https://lol.fandom.com/wiki/Ruler",
    },
    {
      id: "duro",
      name: "Duro",
      realName: "주민규",
      role: "SPT",
      photo:
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/7/75/GEN_Duro_2026_Split_1.png/revision/latest?cb=20260122171225",
      sourceUrl: "https://lol.fandom.com/wiki/Duro",
    },
  ]),
  "lck-hle": createLckMembers("lck-hle", "https://hle.kr/en", [
    {
      id: "zeus",
      name: "Zeus",
      realName: "최우제",
      role: "TOP",
      photo:
        "https://hle.kr/tmp/9f7f1cfb-3a91-4b67-b910-391ec6e28648.png",
    },
    {
      id: "kanavi",
      name: "Kanavi",
      realName: "서진혁",
      role: "JGL",
      photo:
        "https://hle.kr/tmp/77f5de45-4548-4472-a15c-14b1a75e220e.png",
    },
    {
      id: "zeka",
      name: "Zeka",
      realName: "김건우",
      role: "MID",
      photo:
        "https://hle.kr/tmp/d2480fbb-e9d1-40bf-86d2-3fb2d59ed23d.png",
    },
    {
      id: "gumayusi",
      name: "Gumayusi",
      realName: "이민형",
      role: "BOT",
      photo:
        "https://hle.kr/tmp/450c5f2a-f61a-4ab6-86f9-db04a55770c9.png",
    },
    {
      id: "delight",
      name: "Delight",
      realName: "유환중",
      role: "SPT",
      photo:
        "https://hle.kr/tmp/f803e50f-039a-4d26-9da3-d2fdeb7afed4.png",
    },
  ]),
  "lck-dk": createLckMembers("lck-dk", "https://dpluskia.gg/team-lol", [
    {
      id: "siwoo",
      name: "Siwoo",
      realName: "전시우",
      role: "TOP",
      photo: "https://cdn.imweb.me/thumbnail/20260325/829283ab7a0cc.png",
    },
    {
      id: "lucid",
      name: "Lucid",
      realName: "최용혁",
      role: "JGL",
      photo: "https://cdn.imweb.me/thumbnail/20260325/19150ca86a2b7.png",
    },
    {
      id: "showmaker",
      name: "ShowMaker",
      realName: "허수",
      role: "MID",
      photo: "https://cdn.imweb.me/thumbnail/20260325/3f4967b5b53b8.png",
    },
    {
      id: "smash",
      name: "Smash",
      realName: "신금재",
      role: "BOT",
      photo: "https://cdn.imweb.me/thumbnail/20260325/8a18a7117d6c7.png",
    },
    {
      id: "career",
      name: "Career",
      realName: "오형석",
      role: "SPT",
      photo: "https://cdn.imweb.me/thumbnail/20260325/6550a9d363ff4.png",
    },
  ]),
  "lck-kt": createLckMembers(
    "lck-kt",
    "https://kt-sports.co.kr/sports/site/esports/team/player2.do",
    [
      {
        id: "perfect",
        name: "PerfecT",
        realName: "이승민",
        role: "TOP",
        photo:
          "https://kt-sports.co.kr/sports/data/_up/player/61/lck_kt_perfect_a.png",
      },
      {
        id: "cuzz",
        name: "Cuzz",
        realName: "문우찬",
        role: "JGL",
        photo:
          "https://kt-sports.co.kr/sports/data/_up/player/61/lck_kt_cuzz_a.png",
      },
      {
        id: "bdd",
        name: "Bdd",
        realName: "곽보성",
        role: "MID",
        photo:
          "https://kt-sports.co.kr/sports/data/_up/player/61/lck_kt_bdd_a.png",
      },
      {
        id: "aiming",
        name: "Aiming",
        realName: "김하람",
        role: "BOT",
        photo:
          "https://kt-sports.co.kr/sports/data/_up/player/61/lck_kt_aiming_a.png",
      },
      {
        id: "effort",
        name: "Effort",
        realName: "이상호",
        role: "SPT",
        photo:
          "https://kt-sports.co.kr/sports/data/_up/player/61/effort_cl.png",
      },
    ],
  ),
  "lck-krx": createLckMembers("lck-krx", "https://www.drx.gg/lol", [
    {
      id: "rich",
      name: "Rich",
      realName: "이재원",
      role: "TOP",
      photo: "https://cdn.imweb.me/thumbnail/20260601/57cc01dbe7f56.png",
    },
    {
      id: "willer",
      name: "Willer",
      realName: "김정현",
      role: "JGL",
      photo: "https://cdn.imweb.me/thumbnail/20260601/1e84fabf15d09.png",
    },
    {
      id: "ucal",
      name: "Ucal",
      realName: "손우현",
      role: "MID",
      photo: "https://cdn.imweb.me/thumbnail/20260601/3e55a3760517c.png",
    },
    {
      id: "lazyfeel",
      name: "LazyFeel",
      realName: "Trần Bảo Minh",
      role: "BOT",
      photo: "https://cdn.imweb.me/thumbnail/20260601/25736fff55f70.png",
    },
    {
      id: "andil",
      name: "Andil",
      realName: "문관빈",
      role: "SPT",
      photo: "https://cdn.imweb.me/thumbnail/20260601/fd66d973f9c4d.png",
    },
  ]),
  "lck-ns": createLckMembers("lck-ns", "https://www.ns-esports.com/page/22", [
    {
      id: "kingen",
      name: "Kingen",
      realName: "황성훈",
      role: "TOP",
      photo:
        "https://www.ns-esports.com/data/file/team_mb/thumb-2948954260_3SFmUK1d_4d84ad80553040f2a9aef1af9a2e5dca672512a4_400x500.png",
    },
    {
      id: "sponge",
      name: "Sponge",
      realName: "배영준",
      role: "JGL",
      photo:
        "https://www.ns-esports.com/data/file/team_mb/thumb-2948954260_FczdkZUM_2f88528295ac619c9e9def14331817a350dcf380_400x500.png",
    },
    {
      id: "scout",
      name: "Scout",
      realName: "이예찬",
      role: "MID",
      photo:
        "https://www.ns-esports.com/data/file/team_mb/thumb-2948954260_28aozlQC_a45985bdb3bc1ec0eace6bdce315f762b2e3964a_400x500.png",
    },
    {
      id: "diable",
      name: "Diable",
      realName: "남대근",
      role: "BOT",
      photo:
        "https://www.ns-esports.com/data/file/team_mb/thumb-2948954260_lmnIuhC6_fa9ddbfb889aa16acd9f5e3d3d12e891a041d725_400x500.png",
    },
    {
      id: "lehends",
      name: "Lehends",
      realName: "손시우",
      role: "SPT",
      photo:
        "https://www.ns-esports.com/data/file/team_mb/thumb-2948954260_68P2sD0L_5b052d623c8245ec113b4af2922aeb6e7427d96d_400x500.png",
    },
  ]),
  "lck-bfx": createLckMembers("lck-bfx", "https://www.fearx.gg/", [
    {
      id: "clear",
      name: "Clear",
      realName: "송현민",
      role: "TOP",
      photo:
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/8/83/BFX_Clear_2026_Split_1.png/revision/latest?cb=20260122165648",
      sourceUrl: "https://lol.fandom.com/wiki/Clear_(Song_Hyeon-min)",
    },
    {
      id: "raptor",
      name: "Raptor",
      realName: "전어진",
      role: "JGL",
      photo:
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/9/9f/BFX_Raptor_2026_Split_1.png/revision/latest?cb=20260122165753",
      sourceUrl: "https://lol.fandom.com/wiki/Raptor",
    },
    {
      id: "vicla",
      name: "VicLa",
      realName: "이대광",
      role: "MID",
      photo:
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/3/3f/BFX_VicLa_2026_Split_1.png/revision/latest?cb=20260122165802",
      sourceUrl: "https://lol.fandom.com/wiki/VicLa",
    },
    {
      id: "taeyoon",
      name: "Taeyoon",
      realName: "김태윤",
      role: "BOT",
      photo:
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/4/4c/BFX_Taeyoon_2026_Split_2.png/revision/latest?cb=20260516162323",
      sourceUrl: "https://lol.fandom.com/wiki/Taeyoon_(Kim_Tae-yoon)",
    },
    {
      id: "kellin",
      name: "Kellin",
      realName: "김형규",
      role: "SPT",
      photo:
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/b/bc/BFX_Kellin_2026_Split_1.png/revision/latest?cb=20260122165740",
      sourceUrl: "https://lol.fandom.com/wiki/Kellin",
    },
  ]),
  "lck-dns": createLckMembers("lck-dns", "https://soopers.gg/", [
    {
      id: "dudu",
      name: "DuDu",
      realName: "이동주",
      role: "TOP",
      photo:
        "https://soopers.gg/image/team_member/2026/06/30/20260630121119_dd40cf6e-51d9-4b94-a163-d31d61bf8264.png",
    },
    {
      id: "pyosik",
      name: "Pyosik",
      realName: "홍창현",
      role: "JGL",
      photo:
        "https://soopers.gg/image/team_member/2026/06/30/20260630121104_b17e22eb-43a6-4e19-bdce-8c85c77f53a4.png",
    },
    {
      id: "clozer",
      name: "Clozer",
      realName: "이주현",
      role: "MID",
      photo:
        "https://soopers.gg/image/team_member/2026/06/30/20260630121035_4b5a8682-25c2-4bd8-982d-f34ef0ea962d.png",
    },
    {
      id: "deokdam",
      name: "deokdam",
      realName: "서대길",
      role: "BOT",
      photo:
        "https://soopers.gg/image/team_member/2026/06/30/20260630121023_fec4c7a9-2a73-4274-8996-02bab89bc809.png",
    },
    {
      id: "life",
      name: "Life",
      realName: "김정민",
      role: "SPT",
      photo:
        "https://soopers.gg/image/team_member/2026/06/30/20260630121045_e29f88aa-f31a-48eb-84cd-342da8a851ed.png",
    },
  ]),
  "lck-bro": createLckMembers("lck-bro", "https://brionesports.gg/", [
    {
      id: "casting",
      name: "Casting",
      realName: "신민제",
      role: "TOP",
      photo:
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/f/f5/BRO_Casting_2026_Split_1.png/revision/latest?cb=20260122170242",
      sourceUrl: "https://lol.fandom.com/wiki/Casting",
    },
    {
      id: "gideon",
      name: "GIDEON",
      realName: "김민성",
      role: "JGL",
      photo:
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/d/d6/BRO_GIDEON_2026_Split_1.png/revision/latest?cb=20260122170300",
      sourceUrl: "https://lol.fandom.com/wiki/GIDEON",
    },
    {
      id: "roamer",
      name: "Roamer",
      realName: "조우진",
      role: "MID",
      photo:
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/6/69/BRO_Roamer_2026_Split_1.png/revision/latest?cb=20260122170322",
      sourceUrl: "https://lol.fandom.com/wiki/Roamer",
    },
    {
      id: "teddy",
      name: "Teddy",
      realName: "박진성",
      role: "BOT",
      photo:
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/b/bc/BRO_Teddy_2026_Split_1.png/revision/latest?cb=20260122170332",
      sourceUrl: "https://lol.fandom.com/wiki/Teddy",
    },
    {
      id: "namgung",
      name: "Namgung",
      realName: "남궁성환",
      role: "SPT",
      photo:
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/d/d8/BRO_Namgung_2026_Split_1.png/revision/latest?cb=20260122170309",
      sourceUrl: "https://lol.fandom.com/wiki/Namgung",
    },
  ]),
};

const TEAM_EXTRA_MEMBERS_BY_ID = {
  "kbo-doosan": createKboMembers([
    {
      playerId: "67263",
      name: "최원준",
      role: "투수",
      number: "61",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=67263",
    },
    {
      playerId: "67207",
      name: "이유찬",
      role: "내야수",
      number: "13",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=67207",
    },
    {
      playerId: "63123",
      name: "강승호",
      role: "내야수",
      number: "23",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=63123",
    },
    {
      playerId: "66209",
      name: "조수행",
      role: "외야수",
      number: "51",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=66209",
    },
  ]),
  "kbo-lg": createKboMembers([
    {
      playerId: "62415",
      name: "박해민",
      role: "외야수",
      number: "17",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=62415",
    },
    {
      playerId: "65207",
      name: "신민재",
      role: "내야수",
      number: "4",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=65207",
    },
    {
      playerId: "50106",
      name: "유영찬",
      role: "투수",
      number: "54",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=50106",
    },
    {
      playerId: "68119",
      name: "문성주",
      role: "외야수",
      number: "8",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=68119",
    },
    {
      playerId: "53123",
      name: "오스틴",
      role: "내야수",
      number: "23",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=53123",
    },
  ]),
  "kbo-kia": createKboMembers([
    {
      playerId: "68646",
      name: "한준수",
      role: "포수",
      number: "25",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=68646",
    },
    {
      playerId: "53613",
      name: "윤영철",
      role: "투수",
      number: "13",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=53613",
    },
    {
      playerId: "51648",
      name: "이의리",
      role: "투수",
      number: "48",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=51648",
    },
    {
      playerId: "78122",
      name: "김태군",
      role: "포수",
      number: "42",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=78122",
    },
  ]),
  "kbo-samsung": createKboMembers([
    {
      playerId: "52430",
      name: "김영웅",
      role: "내야수",
      number: "30",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=52430",
    },
    {
      playerId: "51454",
      name: "이승현",
      role: "투수",
      number: "57",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=51454",
    },
    {
      playerId: "62234",
      name: "류지혁",
      role: "내야수",
      number: "16",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=62234",
    },
    {
      playerId: "61404",
      name: "김헌곤",
      role: "외야수",
      number: "32",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=61404",
    },
  ]),
  "kbo-lotte": createKboMembers([
    {
      playerId: "54529",
      name: "레이예스",
      role: "외야수",
      number: "29",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=54529",
    },
    {
      playerId: "50150",
      name: "손호영",
      role: "외야수",
      number: "33",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=50150",
    },
    {
      playerId: "51551",
      name: "나승엽",
      role: "내야수",
      number: "51",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=51551",
    },
    {
      playerId: "50500",
      name: "황성빈",
      role: "외야수",
      number: "0",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=50500",
    },
    {
      playerId: "61102",
      name: "유강남",
      role: "포수",
      number: "27",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=61102",
    },
  ]),
  "kbo-hanwha": createKboMembers([
    {
      playerId: "79192",
      name: "채은성",
      role: "내야수",
      number: "22",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=79192",
    },
    {
      playerId: "65056",
      name: "엄상백",
      role: "투수",
      number: "11",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=65056",
    },
    {
      playerId: "62700",
      name: "하주석",
      role: "내야수",
      number: "16",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=62700",
    },
    {
      playerId: "68700",
      name: "이원석",
      role: "외야수",
      number: "37",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=68700",
    },
  ]),
  "kbo-ssg": createKboMembers([
    {
      playerId: "62895",
      name: "한유섬",
      role: "외야수",
      number: "35",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=62895",
    },
    {
      playerId: "62869",
      name: "문승원",
      role: "투수",
      number: "42",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=62869",
    },
    {
      playerId: "60558",
      name: "오태곤",
      role: "외야수",
      number: "37",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=60558",
    },
    {
      playerId: "51897",
      name: "조병현",
      role: "투수",
      number: "19",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=51897",
    },
    {
      playerId: "53892",
      name: "이로운",
      role: "투수",
      number: "92",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=53892",
    },
  ]),
  "kbo-nc": createKboMembers([
    {
      playerId: "63963",
      name: "권희동",
      role: "외야수",
      number: "36",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=63963",
    },
    {
      playerId: "68902",
      name: "신민혁",
      role: "투수",
      number: "18",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=68902",
    },
    {
      playerId: "69995",
      name: "서호철",
      role: "내야수",
      number: "5",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=69995",
    },
    {
      playerId: "51344",
      name: "김휘집",
      role: "내야수",
      number: "44",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=51344",
    },
  ]),
  "kbo-kt": createKboMembers([
    {
      playerId: "64166",
      name: "배정대",
      role: "외야수",
      number: "27",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=64166",
    },
    {
      playerId: "64007",
      name: "문상철",
      role: "내야수",
      number: "24",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=64007",
    },
    {
      playerId: "52001",
      name: "안현민",
      role: "외야수",
      number: "23",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=52001",
    },
    {
      playerId: "65048",
      name: "김민수",
      role: "투수",
      number: "26",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=65048",
    },
  ]),
  "kbo-kiwoom": createKboMembers([
    {
      playerId: "53344",
      name: "김동헌",
      role: "포수",
      number: "44",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=53344",
    },
    {
      playerId: "74163",
      name: "이용규",
      role: "외야수",
      number: "15",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=74163",
    },
    {
      playerId: "76267",
      name: "최주환",
      role: "내야수",
      number: "53",
      link: "/Record/Player/HitterDetail/Basic.aspx?playerId=76267",
    },
    {
      playerId: "64350",
      name: "하영민",
      role: "투수",
      number: "50",
      link: "/Record/Player/PitcherDetail/Basic.aspx?playerId=64350",
    },
  ]),
  "kleague-ulsan": createKLeagueMembers([
    {
      playerId: "20230315",
      name: "Yago CARIELLO RIBEIRO",
      role: "FW",
      number: "99",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K01/player_20230315.png",
    },
    {
      playerId: "20250044",
      name: "Inwoo BACK",
      role: "MF",
      number: "72",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K01/player_20250044.png",
    },
    {
      playerId: "20220188",
      name: "Younggwon",
      role: "DF",
      number: "19",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K01/player_20220188.png",
    },
    {
      playerId: "20170029",
      name: "Jungin",
      role: "GK",
      number: "23",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K01/player_20170029.png",
    },
    {
      playerId: "20250292",
      name: "Erick Samuel MONTEMEZZO FARIAS",
      role: "FW",
      number: "11",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K01/player_20250292.png",
    },
    {
      playerId: "20230108",
      name: "Darijan BOJANIC",
      role: "MF",
      number: "6",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K01/player_20230108.png",
    },
    {
      playerId: "20230140",
      name: "Myungguan SEO",
      role: "DF",
      number: "4",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K01/player_20230140.png",
    },
  ]),
  "kleague-jeonbuk": createKLeagueMembers([
    {
      playerId: "20180212",
      name: "Seungsub KIM",
      role: "FW",
      number: "11",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K05/player_20180212.png",
    },
    {
      playerId: "20220276",
      name: "Sangyoon KANG",
      role: "MF",
      number: "13",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K05/player_20220276.png",
    },
    {
      playerId: "20250050",
      name: "Junyeong KIM",
      role: "DF",
      number: "22",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K05/player_20250050.png",
    },
    {
      playerId: "20180025",
      name: "BUMKEUN",
      role: "GK",
      number: "31",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K05/player_20180025.png",
    },
    {
      playerId: "20230077",
      name: "Changhun KIM",
      role: "FW",
      number: "79",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K05/player_20230077.png",
    },
    {
      playerId: "20250078",
      name: "Minjae KIM",
      role: "MF",
      number: "73",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K05/player_20250078.png",
    },
    {
      playerId: "20180185",
      name: "Taehyun KIM",
      role: "DF",
      number: "77",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K05/player_20180185.png",
    },
  ]),
  "kleague-seoul": createKLeagueMembers([
    {
      playerId: "20250081",
      name: "SELOH SAMUEL GBATO",
      role: "FW",
      number: "99",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K09/player_20250081.png",
    },
    {
      playerId: "20260045",
      name: "Hrvoje BABEC",
      role: "MF",
      number: "6",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K09/player_20260045.png",
    },
    {
      playerId: "20170185",
      name: "KIM Jinsu",
      role: "DF",
      number: "22",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K09/player_20170185.png",
    },
    {
      playerId: "20200301",
      name: "Sungyun GU",
      role: "GK",
      number: "25",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K09/player_20200301.png",
    },
    {
      playerId: "20180034",
      name: "Minkyu",
      role: "FW",
      number: "34",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K09/player_20180034.png",
    },
    {
      playerId: "20220164",
      name: "Hangyeol",
      role: "MF",
      number: "88",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K09/player_20220164.png",
    },
    {
      playerId: "20260048",
      name: "Juan Antonio ROS MARTINEZ",
      role: "DF",
      number: "37",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K09/player_20260048.png",
    },
  ]),
  "kleague-pohang": createKLeagueMembers([
    {
      playerId: "20250019",
      name: "Seungwon BAEK",
      role: "FW",
      number: "34",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K03/player_20250019.png",
    },
    {
      playerId: "20240063",
      name: "Dongjin KIM",
      role: "MF",
      number: "16",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K03/player_20240063.png",
    },
    {
      playerId: "20180215",
      name: "kim yesung",
      role: "DF",
      number: "3",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K03/player_20180215.png",
    },
    {
      playerId: "20240298",
      name: "Neung KWON",
      role: "GK",
      number: "91",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K03/player_20240298.png",
    },
    {
      playerId: "20200043",
      name: "JAEJOON",
      role: "FW",
      number: "9",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K03/player_20200043.png",
    },
    {
      playerId: "20260022",
      name: "Beomjun KIM",
      role: "MF",
      number: "26",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K03/player_20260022.png",
    },
    {
      playerId: "20260026",
      name: "Hojin KIM",
      role: "DF",
      number: "36",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K03/player_20260026.png",
    },
  ]),
  "kleague-daejeon": createKLeagueMembers([
    {
      playerId: "20190130",
      name: "Jinsu SEO",
      role: "FW",
      number: "19",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K10/player_20190130.png",
    },
    {
      playerId: "20230015",
      name: "Kim Do-Youn",
      role: "MF",
      number: "81",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2024/K10/player_20230015.png",
    },
    {
      playerId: "20160037",
      name: "Yoonsung KANG",
      role: "DF",
      number: "6",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K10/player_20160037.png",
    },
    {
      playerId: "20250322",
      name: "Kyung Tae LEE",
      role: "GK",
      number: "40",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K10/player_20250322.png",
    },
    {
      playerId: "20150151",
      name: "Kanghyun YU",
      role: "FW",
      number: "99",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K10/player_20150151.png",
    },
    {
      playerId: "20210176",
      name: "Bongsoo KIM",
      role: "MF",
      number: "30",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K10/player_20210176.png",
    },
    {
      playerId: "20170122",
      name: "MOONHWAN",
      role: "DF",
      number: "33",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K10/player_20170122.png",
    },
  ]),
  "kleague-jeju": createKLeagueMembers([
    {
      playerId: "20200176",
      name: "Ian KIM",
      role: "FW",
      number: "19",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K04/player_20200176.png",
    },
    {
      playerId: "20160047",
      name: "Geonung KIM",
      role: "MF",
      number: "28",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K04/player_20160047.png",
    },
    {
      playerId: "20180166",
      name: "Jaewoo KIM",
      role: "DF",
      number: "41",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K04/player_20180166.png",
    },
    {
      playerId: "20200070",
      name: "CHANGI AN",
      role: "GK",
      number: "21",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K04/player_20200070.png",
    },
    {
      playerId: "20180104",
      name: "Changjun PARK",
      role: "FW",
      number: "7",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K26/player_20180104.png",
    },
    {
      playerId: "20240217",
      name: "Jae KIM",
      role: "MF",
      number: "39",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K04/player_20240217.png",
    },
    {
      playerId: "20250098",
      name: "Jiwoon KIM",
      role: "DF",
      number: "38",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2025/K04/player_20250098.png",
    },
  ]),
  "kleague-gangwon": createKLeagueMembers([
    {
      playerId: "20160098",
      name: "DAEWON KIM",
      role: "FW",
      number: "7",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K21/player_20160098.png",
    },
    {
      playerId: "20200066",
      name: "Youngjun",
      role: "MF",
      number: "11",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K21/player_20200066.png",
    },
    {
      playerId: "20230308",
      name: "MARKO TUCI",
      role: "DF",
      number: "23",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K21/player_20230308.png",
    },
    {
      playerId: "20250220",
      name: "Junghoon KIM",
      role: "GK",
      number: "21",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K21/player_20250220.png",
    },
    {
      playerId: "20220063",
      name: "Kim Hea-Seung",
      role: "FW",
      number: "43",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2024/K21/player_20220063.png",
    },
    {
      playerId: "20180235",
      name: "DONG HYUN KIM",
      role: "MF",
      number: "6",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K21/player_20180235.png",
    },
    {
      playerId: "20230203",
      name: "Dohyun KIM",
      role: "DF",
      number: "27",
      photo:
        "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/2026/K21/player_20230203.png",
    },
  ]),
};

const TEAM_MEMBER_LIMIT_BY_LEAGUE = {
  kbo: 9,
  kleague: 11,
  lck: 5,
};

const createTeamMembers = (team) => {
  const baseMembers = TEAM_MEMBERS_BY_ID[team.id] || team.members;
  const extraMembers = TEAM_EXTRA_MEMBERS_BY_ID[team.id] || [];
  const members = baseMembers ? [...baseMembers, ...extraMembers] : null;

  if (!members) {
    return createMembers(team).map((member) => ({
      ...member,
      fallbackPhoto: member.photo,
    }));
  }

  const memberLimit = TEAM_MEMBER_LIMIT_BY_LEAGUE[team.league] || members.length;

  return members.slice(0, memberLimit).map((member, index) => {
    const fallbackPhoto = createMemberPhoto(team, member, index);

    return {
      ...member,
      id: member.id || `${team.id}-member-${index + 1}`,
      photo: member.photo || fallbackPhoto,
      fallbackPhoto,
    };
  });
};

const createTeam = (team) => ({
  ...team,
  matchSport: TEAM_SPORT_BY_LEAGUE[team.league],
  matchCodes: TEAM_MATCH_CODES[team.id] || [],
  members: createTeamMembers(team),
  ratings: createRatings(team.ratings),
});

export const TEAM_FILTERS = [
  { id: "all", label: "ALL" },
  { id: "kbo", label: "KBO" },
  { id: "kleague", label: "K LEAGUE" },
  { id: "lck", label: "LCK" },
];

export const TEAM_LEAGUE_LABELS = {
  kbo: "KBO",
  kleague: "K LEAGUE",
  lck: "LCK",
};

export const FEATURED_TEAMS = [
  createTeam({
    id: "kbo-doosan",
    league: "kbo",
    name: "두산 베어스",
    shortName: "DOOSAN",
    home: "잠실",
    logo: "/logos/doosan.png",
    tone: "끈질긴 승부와 큰 경기 DNA",
    intro:
      "흐름을 쉽게 내주지 않는 야구와 두꺼운 팬층으로 입문하기 좋은 서울 인기 구단입니다.",
    entryPoint: "라이벌전, 가을야구 서사, 잠실 직관 분위기부터 보면 빠르게 감이 옵니다.",
    tags: ["잠실", "가을야구", "허슬"],
    players: [
      { name: "클러치 타자", role: "타선", note: "찬스에서 분위기를 바꾸는 유형" },
      { name: "수비형 야수", role: "야수", note: "탄탄한 기본기를 보는 재미" },
      { name: "불펜 카드", role: "투수", note: "후반 승부처를 책임지는 선수군" },
    ],
    fanGuide: [
      "잠실 홈경기 응원석 분위기부터 익히기",
      "LG와의 잠실 라이벌전 챙겨보기",
      "수비와 작전 야구를 같이 보면 더 재밌습니다.",
    ],
    ratings: {
      입문난이도: 4,
      팬덤화력: 5,
      직관재미: 5,
      스토리성: 5,
      굿즈욕구: 4,
    },
  }),
  createTeam({
    id: "kbo-lg",
    league: "kbo",
    name: "LG 트윈스",
    shortName: "LG",
    home: "잠실",
    logo: "/logos/lg.png",
    tone: "세련된 공격 야구와 서울 라이벌리",
    intro:
      "잠실을 함께 쓰는 강팀 이미지와 도시적인 팬 문화가 강한 팀입니다.",
    entryPoint: "타선의 연결, 응원가, 잠실 더비를 따라가면 팀 색깔이 선명합니다.",
    tags: ["잠실", "공격야구", "서울"],
    players: [
      { name: "테이블세터", role: "타선", note: "공격의 시작을 만드는 선수군" },
      { name: "중심타자", role: "타선", note: "장타와 해결 능력을 보는 포인트" },
      { name: "마무리 투수", role: "투수", note: "마지막 이닝 긴장감의 핵심" },
    ],
    fanGuide: [
      "상위 타선 출루 장면부터 보기",
      "두산전 분위기 비교하기",
      "응원가와 유니폼 색 조합을 같이 즐기기",
    ],
    ratings: {
      입문난이도: 5,
      팬덤화력: 5,
      직관재미: 5,
      스토리성: 4,
      굿즈욕구: 5,
    },
  }),
  createTeam({
    id: "kbo-kia",
    league: "kbo",
    name: "KIA 타이거즈",
    shortName: "KIA",
    home: "광주",
    logo: "/logos/kia.png",
    tone: "전통과 에너지, 뜨거운 지역 팬덤",
    intro:
      "강한 역사와 스타 서사가 많은 팀이라 과거와 현재를 같이 파기 좋습니다.",
    entryPoint: "광주 홈 분위기와 타이거즈 레전드 스토리를 함께 보면 몰입이 빠릅니다.",
    tags: ["광주", "전통", "화력"],
    players: [
      { name: "프랜차이즈 투수", role: "투수", note: "팀 정체성을 대표하는 유형" },
      { name: "젊은 내야수", role: "야수", note: "속도와 장타를 함께 보는 재미" },
      { name: "클린업 타자", role: "타선", note: "득점 장면의 중심" },
    ],
    fanGuide: [
      "홈 응원 분위기 영상으로 입문하기",
      "타이거즈 우승 서사 훑어보기",
      "젊은 야수 성장 곡선을 따라가기",
    ],
    ratings: {
      입문난이도: 4,
      팬덤화력: 5,
      직관재미: 5,
      스토리성: 5,
      굿즈욕구: 4,
    },
  }),
  createTeam({
    id: "kbo-samsung",
    league: "kbo",
    name: "삼성 라이온즈",
    shortName: "SAMSUNG",
    home: "대구",
    logo: "/logos/samsung.png",
    tone: "왕조 기억과 대구의 긴 호흡",
    intro:
      "강팀 시절의 서사와 새로운 세대의 반등을 같이 보는 재미가 있는 팀입니다.",
    entryPoint: "대구 홈런 분위기, 왕조 시절 이야기, 선발 투수 운영을 같이 보세요.",
    tags: ["대구", "왕조", "장타"],
    players: [
      { name: "장타형 외야수", role: "타선", note: "경기 흐름을 한 방에 바꾸는 유형" },
      { name: "토종 선발", role: "투수", note: "긴 이닝을 책임지는 핵심" },
      { name: "젊은 내야진", role: "야수", note: "성장 서사를 따라가기 좋음" },
    ],
    fanGuide: [
      "대구 홈런 장면 모아보기",
      "왕조 시절 주요 경기부터 보기",
      "선발 로테이션을 따라가며 보기",
    ],
    ratings: {
      입문난이도: 4,
      팬덤화력: 4,
      직관재미: 4,
      스토리성: 5,
      굿즈욕구: 4,
    },
  }),
  createTeam({
    id: "kbo-lotte",
    league: "kbo",
    name: "롯데 자이언츠",
    shortName: "LOTTE",
    home: "부산",
    logo: "/logos/lotte.png",
    tone: "부산의 낭만과 압도적인 응원",
    intro:
      "결과와 별개로 응원 문화 하나만으로도 입문 가치가 큰 팀입니다.",
    entryPoint: "사직 응원과 부산 팬덤 분위기를 먼저 보면 팀의 매력을 바로 느낄 수 있습니다.",
    tags: ["부산", "사직", "응원"],
    players: [
      { name: "프랜차이즈 타자", role: "타선", note: "팬덤의 감정을 모으는 중심" },
      { name: "파워 히터", role: "타선", note: "사직을 흔드는 장타 포인트" },
      { name: "젊은 투수", role: "투수", note: "미래를 기대하게 하는 유형" },
    ],
    fanGuide: [
      "사직 응원 영상부터 보기",
      "부산 라이벌 매치 챙기기",
      "팀의 낭만 서사를 알고 보면 더 깊어집니다.",
    ],
    ratings: {
      입문난이도: 5,
      팬덤화력: 5,
      직관재미: 5,
      스토리성: 5,
      굿즈욕구: 5,
    },
  }),
  createTeam({
    id: "kbo-hanwha",
    league: "kbo",
    name: "한화 이글스",
    shortName: "HANWHA",
    home: "대전",
    logo: "/logos/hanwha.png",
    tone: "기다림과 폭발력의 서사",
    intro:
      "젊은 재능과 충성도 높은 팬덤이 만나 성장 서사를 따라가기 좋은 팀입니다.",
    entryPoint: "대전 홈 분위기와 젊은 투수진의 성장 흐름을 보면 입덕 포인트가 보입니다.",
    tags: ["대전", "성장", "낭만"],
    players: [
      { name: "파이어볼러", role: "투수", note: "구속과 삼진을 보는 재미" },
      { name: "홈런 타자", role: "타선", note: "한 방으로 분위기를 바꾸는 선수군" },
      { name: "젊은 코어", role: "야수", note: "팀의 다음 장을 여는 유형" },
    ],
    fanGuide: [
      "젊은 선수 하이라이트부터 보기",
      "대전 홈 개막전 분위기 찾아보기",
      "긴 연패와 반등 서사를 알면 더 몰입됩니다.",
    ],
    ratings: {
      입문난이도: 4,
      팬덤화력: 5,
      직관재미: 4,
      스토리성: 5,
      굿즈욕구: 4,
    },
  }),
  createTeam({
    id: "kbo-ssg",
    league: "kbo",
    name: "SSG 랜더스",
    shortName: "SSG",
    home: "인천",
    logo: "/logos/ssg.png",
    tone: "인천 야구와 빠른 전환",
    intro:
      "현대적인 구단 운영과 인천 홈 분위기가 어우러진 팀입니다.",
    entryPoint: "문학 홈경기와 중심타선의 공격 흐름을 따라가 보세요.",
    tags: ["인천", "문학", "스피드"],
    players: [
      { name: "베테랑 타자", role: "타선", note: "경험으로 찬스를 살리는 유형" },
      { name: "외야 수비수", role: "야수", note: "넓은 수비 범위를 보는 재미" },
      { name: "불펜 에이스", role: "투수", note: "후반 승부처의 핵심" },
    ],
    fanGuide: [
      "문학 홈런 장면부터 보기",
      "인천 야구 계보를 같이 훑기",
      "불펜 운영을 따라가며 보기",
    ],
    ratings: {
      입문난이도: 4,
      팬덤화력: 4,
      직관재미: 4,
      스토리성: 4,
      굿즈욕구: 4,
    },
  }),
  createTeam({
    id: "kbo-nc",
    league: "kbo",
    name: "NC 다이노스",
    shortName: "NC",
    home: "창원",
    logo: "/logos/nc.png",
    tone: "젊고 날렵한 창원 야구",
    intro:
      "비교적 젊은 구단이지만 빠르게 색깔을 만든 팀이라 새 팬이 들어가기 쉽습니다.",
    entryPoint: "창원NC파크 분위기와 기동력 있는 경기 운영을 중심으로 보세요.",
    tags: ["창원", "젊은팀", "기동력"],
    players: [
      { name: "컨택 타자", role: "타선", note: "꾸준히 출루를 만드는 유형" },
      { name: "멀티 야수", role: "야수", note: "여러 포지션을 소화하는 선수군" },
      { name: "외국인 선발", role: "투수", note: "경기 초반 흐름의 중심" },
    ],
    fanGuide: [
      "창원NC파크 직관 후기를 보기",
      "기동력 있는 공격 장면 살펴보기",
      "새 구단의 성장 서사를 같이 보면 좋습니다.",
    ],
    ratings: {
      입문난이도: 5,
      팬덤화력: 3,
      직관재미: 4,
      스토리성: 4,
      굿즈욕구: 4,
    },
  }),
  createTeam({
    id: "kbo-kt",
    league: "kbo",
    name: "KT 위즈",
    shortName: "KT",
    home: "수원",
    logo: "/logos/kt.png",
    tone: "차분하지만 단단한 경기 운영",
    intro:
      "짧은 역사 안에서 강팀의 기억을 만든 팀이라 성장형 팬에게 잘 맞습니다.",
    entryPoint: "수원 홈경기와 선발 야구, 후반 운영을 같이 보면 매력이 보입니다.",
    tags: ["수원", "운영", "성장"],
    players: [
      { name: "에이스 선발", role: "투수", note: "경기 전체 톤을 만드는 유형" },
      { name: "중심 타자", role: "타선", note: "득점권에서 보는 포인트" },
      { name: "수비형 내야수", role: "야수", note: "안정적인 플레이의 기반" },
    ],
    fanGuide: [
      "선발 투수 매치업부터 보기",
      "수원 홈 응원 분위기 살펴보기",
      "후반 작전과 불펜 운용에 집중하기",
    ],
    ratings: {
      입문난이도: 4,
      팬덤화력: 3,
      직관재미: 4,
      스토리성: 4,
      굿즈욕구: 3,
    },
  }),
  createTeam({
    id: "kbo-kiwoom",
    league: "kbo",
    name: "키움 히어로즈",
    shortName: "KIWOOM",
    home: "고척",
    logo: "/logos/kiwoom.png",
    tone: "유망주와 반전의 팀",
    intro:
      "선수 발굴과 성장 서사를 보는 재미가 강한 팀입니다.",
    entryPoint: "고척돔 분위기와 젊은 선수의 성장 곡선을 따라가면 좋습니다.",
    tags: ["고척", "유망주", "성장"],
    players: [
      { name: "신인 야수", role: "야수", note: "매년 새 얼굴을 보는 재미" },
      { name: "선발 유망주", role: "투수", note: "성장 서사가 뚜렷한 유형" },
      { name: "빠른 주자", role: "타선", note: "작은 플레이로 흐름을 바꿈" },
    ],
    fanGuide: [
      "유망주 콜업 소식을 따라가기",
      "고척돔 직관 접근성을 활용하기",
      "선수 성장 과정을 보는 팬에게 잘 맞습니다.",
    ],
    ratings: {
      입문난이도: 3,
      팬덤화력: 3,
      직관재미: 3,
      스토리성: 5,
      굿즈욕구: 3,
    },
  }),
  createTeam({
    id: "kleague-ulsan",
    league: "kleague",
    name: "울산 HD FC",
    shortName: "울산",
    home: "울산",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K01.png`,
    tone: "우승권의 안정감과 강한 압박",
    intro:
      "강팀의 기준을 보고 싶다면 입문하기 좋은 K리그 대표 강호입니다.",
    entryPoint: "우승 경쟁 경기와 현대가 더비를 먼저 보면 팀의 무게감이 느껴집니다.",
    tags: ["우승권", "현대가더비", "압박"],
    players: [
      { name: "중원 지휘자", role: "MID", note: "템포를 조절하는 핵심 유형" },
      { name: "측면 공격수", role: "FW", note: "빠른 전환의 출발점" },
      { name: "센터백 리더", role: "DF", note: "수비 안정감을 만드는 선수군" },
    ],
    fanGuide: [
      "현대가 더비부터 보기",
      "압박 후 빠른 전개 장면에 집중하기",
      "우승 경쟁 막판 경기들을 보면 몰입이 쉽습니다.",
    ],
    ratings: {
      입문난이도: 5,
      팬덤화력: 4,
      직관재미: 4,
      스토리성: 5,
      굿즈욕구: 4,
    },
  }),
  createTeam({
    id: "kleague-jeonbuk",
    league: "kleague",
    name: "전북 현대 모터스",
    shortName: "전북",
    home: "전주",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K05.png`,
    tone: "명문 구단의 자존심",
    intro:
      "강팀 서사와 라이벌리가 뚜렷해 K리그 흐름을 배우기 좋은 팀입니다.",
    entryPoint: "현대가 더비와 전주성 응원 분위기를 먼저 보세요.",
    tags: ["전주성", "명문", "라이벌"],
    players: [
      { name: "박스 스트라이커", role: "FW", note: "득점을 책임지는 유형" },
      { name: "전진형 미드필더", role: "MID", note: "공격 전환의 핵심" },
      { name: "풀백", role: "DF", note: "측면 공격 가담을 보는 재미" },
    ],
    fanGuide: [
      "전주성 응원 장면 보기",
      "현대가 더비 히스토리 훑기",
      "측면 전개와 크로스 패턴에 집중하기",
    ],
    ratings: {
      입문난이도: 5,
      팬덤화력: 5,
      직관재미: 5,
      스토리성: 5,
      굿즈욕구: 5,
    },
  }),
  createTeam({
    id: "kleague-seoul",
    league: "kleague",
    name: "FC 서울",
    shortName: "서울",
    home: "서울",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K09.png`,
    tone: "수도권 빅클럽과 큰 경기 분위기",
    intro:
      "접근성이 좋고 라이벌 매치가 많아 새 팬이 경기장을 찾기 좋은 팀입니다.",
    entryPoint: "서울월드컵경기장 직관과 슈퍼매치 분위기를 먼저 경험해 보세요.",
    tags: ["상암", "빅클럽", "슈퍼매치"],
    players: [
      { name: "공격형 미드필더", role: "MID", note: "찬스를 설계하는 유형" },
      { name: "라인 브레이커", role: "FW", note: "뒷공간 침투를 보는 재미" },
      { name: "골키퍼", role: "GK", note: "큰 경기 세이브의 주인공" },
    ],
    fanGuide: [
      "상암 직관 동선부터 익히기",
      "슈퍼매치와 수도권 더비를 챙기기",
      "응원가를 알고 가면 훨씬 재밌습니다.",
    ],
    ratings: {
      입문난이도: 5,
      팬덤화력: 5,
      직관재미: 5,
      스토리성: 5,
      굿즈욕구: 5,
    },
  }),
  createTeam({
    id: "kleague-pohang",
    league: "kleague",
    name: "포항 스틸러스",
    shortName: "포항",
    home: "포항",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K03.png`,
    tone: "육성 명가와 짜임새 있는 축구",
    intro:
      "선수 성장과 조직적인 축구를 좋아하면 입문 만족도가 높은 팀입니다.",
    entryPoint: "포항의 유스 서사와 빠른 패스 전개를 중심으로 보세요.",
    tags: ["육성", "조직력", "스틸야드"],
    players: [
      { name: "유스 출신 코어", role: "MID", note: "팀 철학을 보여주는 유형" },
      { name: "침투형 윙어", role: "FW", note: "공간을 파고드는 플레이" },
      { name: "빌드업 센터백", role: "DF", note: "후방 전개의 시작" },
    ],
    fanGuide: [
      "스틸야드 홈 분위기 찾아보기",
      "유스 출신 선수 성장 흐름 보기",
      "패스 전환 속도에 집중하기",
    ],
    ratings: {
      입문난이도: 4,
      팬덤화력: 4,
      직관재미: 4,
      스토리성: 5,
      굿즈욕구: 4,
    },
  }),
  createTeam({
    id: "kleague-daejeon",
    league: "kleague",
    name: "대전 하나시티즌",
    shortName: "대전",
    home: "대전",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K10.png`,
    tone: "새로운 투자와 상승세의 에너지",
    intro:
      "성장하는 팀의 분위기를 같이 타고 싶은 팬에게 잘 맞는 팀입니다.",
    entryPoint: "홈 응원과 공격적인 경기 흐름을 먼저 보면 입덕 포인트가 보입니다.",
    tags: ["대전", "성장", "공격"],
    players: [
      { name: "전방 압박수", role: "FW", note: "수비를 공격처럼 시작하는 유형" },
      { name: "중원 활동량", role: "MID", note: "경기장을 넓게 쓰는 선수군" },
      { name: "신예 수비수", role: "DF", note: "성장 서사를 따라가기 좋음" },
    ],
    fanGuide: [
      "대전 홈 응원 영상 보기",
      "공격 전환 장면을 따라가기",
      "승격 이후 서사를 알면 더 재밌습니다.",
    ],
    ratings: {
      입문난이도: 4,
      팬덤화력: 4,
      직관재미: 4,
      스토리성: 4,
      굿즈욕구: 4,
    },
  }),
  createTeam({
    id: "kleague-jeju",
    league: "kleague",
    name: "제주SK FC",
    shortName: "제주",
    home: "제주",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K04.png`,
    tone: "원정 여행과 부드러운 축구",
    intro:
      "제주 원정이라는 확실한 매력과 팀 색을 함께 가진 구단입니다.",
    entryPoint: "제주 홈경기와 원정 여행 코스를 같이 상상하면 입문이 쉬워집니다.",
    tags: ["제주", "원정", "템포"],
    players: [
      { name: "볼 운반 미드필더", role: "MID", note: "중원에서 전진을 만드는 유형" },
      { name: "측면 크로서", role: "DF", note: "넓은 경기장을 쓰는 선수군" },
      { name: "결정력 공격수", role: "FW", note: "적은 찬스를 살리는 포인트" },
    ],
    fanGuide: [
      "제주 원정 직관 후기를 보기",
      "중원 전개와 측면 활용 보기",
      "홈경기 풍경도 팀 매력의 일부입니다.",
    ],
    ratings: {
      입문난이도: 3,
      팬덤화력: 3,
      직관재미: 4,
      스토리성: 4,
      굿즈욕구: 4,
    },
  }),
  createTeam({
    id: "kleague-gangwon",
    league: "kleague",
    name: "강원 FC",
    shortName: "강원",
    home: "강원",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K21.png`,
    tone: "언더독과 지역 밀착의 힘",
    intro:
      "작은 차이를 극복하는 경기와 지역성이 살아 있는 팀입니다.",
    entryPoint: "강원 홈의 계절감과 언더독 경기를 같이 보면 좋습니다.",
    tags: ["강원", "언더독", "지역성"],
    players: [
      { name: "활동량 미드필더", role: "MID", note: "많이 뛰는 재미를 보여주는 유형" },
      { name: "세트피스 키커", role: "MID", note: "정지 상황의 긴장감" },
      { name: "수비 리더", role: "DF", note: "버티는 경기의 중심" },
    ],
    fanGuide: [
      "강원 홈경기 분위기 찾아보기",
      "세트피스 장면을 유심히 보기",
      "언더독 승리 경기를 보면 매력이 큽니다.",
    ],
    ratings: {
      입문난이도: 3,
      팬덤화력: 3,
      직관재미: 4,
      스토리성: 5,
      굿즈욕구: 3,
    },
  }),
  createTeam({
    id: "kleague-anyang",
    league: "kleague",
    name: "FC 안양",
    shortName: "안양",
    home: "안양",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K27.png`,
    tone: "끈질긴 압박과 승격 서사",
    intro:
      "승격 이후의 도전과 지역 팬덤의 밀도를 함께 느끼기 좋은 팀입니다.",
    entryPoint: "안양 홈 응원과 빠른 전환 장면을 먼저 보면 팀 색이 잘 보입니다.",
    tags: ["안양", "승격", "압박"],
    players: [
      { name: "전방 압박수", role: "FW", note: "수비를 공격처럼 시작하는 유형" },
      { name: "활동량 미드필더", role: "MID", note: "경기장을 넓게 쓰는 선수군" },
      { name: "수비 리더", role: "DF", note: "버티는 경기의 중심" },
    ],
    fanGuide: [
      "승격 시즌 서사부터 보기",
      "전방 압박과 빠른 전환 장면을 따라가기",
      "안양 홈 응원 분위기를 보면 매력이 큽니다.",
    ],
    ratings: {
      입문난이도: 4,
      팬덤화력: 4,
      직관재미: 4,
      스토리성: 5,
      굿즈욕구: 3,
    },
  }),
  createTeam({
    id: "kleague-incheon",
    league: "kleague",
    name: "인천 유나이티드",
    shortName: "인천",
    home: "인천",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K18.png`,
    tone: "끈질긴 생존력과 항구도시 팬덤",
    intro:
      "극적인 경기와 지역성이 뚜렷해 스토리로 입문하기 좋은 팀입니다.",
    entryPoint: "인천 홈 응원과 막판 승부처 경기를 먼저 보면 팀 매력이 잘 보입니다.",
    tags: ["인천", "생존왕", "지역성"],
    players: [
      { name: "결정력 공격수", role: "FW", note: "적은 찬스를 살리는 포인트" },
      { name: "역습형 윙어", role: "FW", note: "공간을 빠르게 파고드는 유형" },
      { name: "수비 리더", role: "DF", note: "버티는 경기의 중심" },
    ],
    fanGuide: [
      "인천 홈 응원 분위기 보기",
      "막판 승부처 경기 서사를 따라가기",
      "역습과 세트피스 장면을 같이 보면 좋습니다.",
    ],
    ratings: {
      입문난이도: 4,
      팬덤화력: 4,
      직관재미: 4,
      스토리성: 5,
      굿즈욕구: 3,
    },
  }),
  createTeam({
    id: "kleague-bucheon",
    league: "kleague",
    name: "부천 FC 1995",
    shortName: "부천",
    home: "부천",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K26.png`,
    tone: "도전자 감성과 단단한 조직력",
    intro:
      "언더독 서사와 압축적인 홈 분위기를 좋아하는 팬에게 잘 맞는 팀입니다.",
    entryPoint: "부천 홈경기와 빠른 공격 전환 장면부터 보면 입문이 쉽습니다.",
    tags: ["부천", "언더독", "조직력"],
    players: [
      { name: "활동량 공격수", role: "FW", note: "압박과 침투를 함께 보는 유형" },
      { name: "중원 연결자", role: "MID", note: "공격 전환의 속도를 만드는 선수군" },
      { name: "수비 리더", role: "DF", note: "버티는 경기의 중심" },
    ],
    fanGuide: [
      "부천 홈 응원 분위기 보기",
      "언더독 승리 경기부터 보기",
      "조직적인 수비 전환을 따라가면 좋습니다.",
    ],
    ratings: {
      입문난이도: 3,
      팬덤화력: 3,
      직관재미: 4,
      스토리성: 4,
      굿즈욕구: 3,
    },
  }),
  createTeam({
    id: "kleague-gimcheon",
    league: "kleague",
    name: "김천 상무",
    shortName: "김천",
    home: "김천",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K35.png`,
    tone: "군 팀 특유의 변화와 전력 밀도",
    intro:
      "선수단 변화가 잦지만 탄탄한 기본기와 새로운 조합을 보는 재미가 있습니다.",
    entryPoint: "새로 합류한 선수들의 역할 변화와 빠른 적응 과정을 따라가 보세요.",
    tags: ["김천", "상무", "전력밀도"],
    players: [
      { name: "전방 공격수", role: "FW", note: "결정력과 움직임을 보는 유형" },
      { name: "중원 활동량", role: "MID", note: "경기장을 넓게 쓰는 선수군" },
      { name: "수비 코어", role: "DF", note: "조직력을 잡아주는 포인트" },
    ],
    fanGuide: [
      "선수단 변화 흐름 보기",
      "군 팀 특유의 조합 변화를 따라가기",
      "전술 적응 과정을 보면 더 재밌습니다.",
    ],
    ratings: {
      입문난이도: 3,
      팬덤화력: 3,
      직관재미: 3,
      스토리성: 4,
      굿즈욕구: 3,
    },
  }),
  createTeam({
    id: "kleague-gwangju",
    league: "kleague",
    name: "광주 FC",
    shortName: "광주",
    home: "광주",
    logo: `${KLEAGUE_LOGO_URL}/emblem_K22.png`,
    tone: "전술 색이 강한 도전형 팀",
    intro:
      "짜임새 있는 빌드업과 압박 축구를 보는 재미가 분명한 팀입니다.",
    entryPoint: "후방 빌드업과 압박 전환 장면을 먼저 보면 팀 색이 선명합니다.",
    tags: ["광주", "전술", "빌드업"],
    players: [
      { name: "볼 운반 미드필더", role: "MID", note: "중원에서 전진을 만드는 유형" },
      { name: "압박형 공격수", role: "FW", note: "수비를 공격처럼 시작하는 선수군" },
      { name: "빌드업 수비수", role: "DF", note: "후방 전개의 시작점" },
    ],
    fanGuide: [
      "빌드업 장면을 천천히 보기",
      "압박 후 전환 속도에 집중하기",
      "전술 색이 뚜렷한 경기부터 보면 좋습니다.",
    ],
    ratings: {
      입문난이도: 4,
      팬덤화력: 3,
      직관재미: 4,
      스토리성: 5,
      굿즈욕구: 3,
    },
  }),
  createTeam({
    id: "lck-t1",
    league: "lck",
    name: "T1",
    shortName: "T1",
    home: "LCK Arena",
    logo: "https://cdn-api.pandascore.co/images/team/image/126061/t_oscq04.png",
    tone: "왕조, 스타성, 큰 경기의 기준",
    intro:
      "LoL e스포츠를 처음 본다면 가장 많은 역사와 서사를 가진 입문 정석 팀입니다.",
    entryPoint: "국제전 하이라이트와 큰 경기 밴픽부터 보면 팀의 무게감이 바로 보입니다.",
    tags: ["왕조", "국제전", "스타성"],
    players: [
      { name: "라인전 코어", role: "LANE", note: "초반 주도권을 보는 포인트" },
      { name: "교전 설계자", role: "JUNGLE", note: "한타 시작 각을 여는 유형" },
      { name: "클러치 딜러", role: "CARRY", note: "큰 경기 마지막 장면의 중심" },
    ],
    fanGuide: [
      "월즈 주요 경기 하이라이트부터 보기",
      "밴픽과 라인전 주도권을 같이 보기",
      "팬덤 밈과 응원 문화를 알면 더 재밌습니다.",
    ],
    ratings: {
      입문난이도: 5,
      팬덤화력: 5,
      직관재미: 5,
      스토리성: 5,
      굿즈욕구: 5,
    },
  }),
  createTeam({
    id: "lck-gen",
    league: "lck",
    name: "Gen.G",
    shortName: "GEN",
    home: "LCK Arena",
    logo: "https://cdn-api.pandascore.co/images/team/image/2882/699px_gen.g_esports_2026_allmode.png",
    tone: "정교한 운영과 라인전의 완성도",
    intro:
      "깔끔한 운영과 높은 체급의 경기를 보고 싶다면 잘 맞는 팀입니다.",
    entryPoint: "라인전 격차가 오브젝트로 연결되는 흐름을 따라가 보세요.",
    tags: ["운영", "라인전", "체급"],
    players: [
      { name: "라인전 장인", role: "MID", note: "CS와 압박을 보는 재미" },
      { name: "오브젝트 설계자", role: "JUNGLE", note: "운영 흐름의 핵심" },
      { name: "후반 캐리", role: "BOT", note: "정교한 포지셔닝을 보는 포인트" },
    ],
    fanGuide: [
      "초반 라인전 지표를 같이 보기",
      "드래곤/전령 운영 타이밍 보기",
      "한타 전 시야 장악 흐름을 따라가기",
    ],
    ratings: {
      입문난이도: 4,
      팬덤화력: 5,
      직관재미: 4,
      스토리성: 4,
      굿즈욕구: 5,
    },
  }),
  createTeam({
    id: "lck-hle",
    league: "lck",
    name: "한화생명 e스포츠",
    shortName: "HLE",
    home: "LCK Arena",
    logo: "https://cdn-api.pandascore.co/images/team/image/2883/hanwha-life-esports-1s04vbu0.png",
    tone: "강한 투자와 우승 도전 서사",
    intro:
      "화려한 로스터와 우승 도전의 긴장감을 함께 즐기기 좋은 팀입니다.",
    entryPoint: "상위권 맞대결과 캐리 라인의 한타 장면부터 보세요.",
    tags: ["도전", "한타", "화력"],
    players: [
      { name: "탑 캐리", role: "TOP", note: "사이드 압박을 보는 재미" },
      { name: "메이킹 서포터", role: "SUP", note: "교전 시작 각의 핵심" },
      { name: "후반 딜러", role: "BOT", note: "한타 화력의 중심" },
    ],
    fanGuide: [
      "상위권 매치 하이라이트 보기",
      "한타 시작 각과 딜러 위치를 같이 보기",
      "로스터 변화 서사를 따라가기",
    ],
    ratings: {
      입문난이도: 4,
      팬덤화력: 4,
      직관재미: 5,
      스토리성: 5,
      굿즈욕구: 4,
    },
  }),
  createTeam({
    id: "lck-dk",
    league: "lck",
    name: "Dplus KIA",
    shortName: "DK",
    home: "LCK Arena",
    logo: "https://cdn-api.pandascore.co/images/team/image/132531/800px_dplus_lightmode.png",
    tone: "월즈 우승 기억과 공격적인 교전",
    intro:
      "교전과 캐리력이 뚜렷한 경기를 좋아하면 입문 만족도가 높은 팀입니다.",
    entryPoint: "정글 중심 교전과 과감한 한타 장면부터 보면 매력이 잘 보입니다.",
    tags: ["교전", "월즈", "공격성"],
    players: [
      { name: "캐리 정글", role: "JUNGLE", note: "맵 전체를 흔드는 유형" },
      { name: "메이지 미드", role: "MID", note: "한타 구도를 만드는 선수군" },
      { name: "공격형 탑", role: "TOP", note: "사이드에서 변수를 만듦" },
    ],
    fanGuide: [
      "월즈 우승 시절 서사 보기",
      "정글 동선과 교전 선택 보기",
      "불리한 경기의 뒤집기 장면 찾기",
    ],
    ratings: {
      입문난이도: 4,
      팬덤화력: 4,
      직관재미: 5,
      스토리성: 5,
      굿즈욕구: 4,
    },
  }),
  createTeam({
    id: "lck-kt",
    league: "lck",
    name: "KT Rolster",
    shortName: "KT",
    home: "LCK Arena",
    logo: "https://cdn-api.pandascore.co/images/team/image/63/kt_rolsterlogo_profile.png",
    tone: "통신사 라이벌리와 롤러코스터",
    intro:
      "예측 불가능한 경기와 오래된 라이벌리를 좋아하면 빠지기 쉬운 팀입니다.",
    entryPoint: "통신사 더비와 역전 경기 하이라이트부터 보면 됩니다.",
    tags: ["통신사더비", "변수", "롤러코스터"],
    players: [
      { name: "베테랑 오더", role: "CALL", note: "흐름을 바꾸는 판단" },
      { name: "공격형 정글", role: "JUNGLE", note: "초반 변수 창출" },
      { name: "라인 캐리", role: "LANE", note: "체급으로 밀어붙이는 유형" },
    ],
    fanGuide: [
      "통신사 더비부터 보기",
      "역전과 실수까지 같이 즐기기",
      "초반 설계가 실패했을 때 대응을 보면 재밌습니다.",
    ],
    ratings: {
      입문난이도: 4,
      팬덤화력: 4,
      직관재미: 5,
      스토리성: 5,
      굿즈욕구: 4,
    },
  }),
  createTeam({
    id: "lck-krx",
    league: "lck",
    name: "Kiwoom DRX",
    shortName: "KRX",
    home: "LCK Arena",
    logo: "https://cdn-api.pandascore.co/images/team/image/126370/220px_dr_xlogo_square.png",
    tone: "언더독 우승 신화와 새 출발",
    intro:
      "언더독 서사와 성장형 로스터를 좋아하는 팬에게 어울립니다.",
    entryPoint: "기적 같은 우승 서사와 신예 성장 흐름을 함께 보면 좋습니다.",
    tags: ["언더독", "성장", "기적"],
    players: [
      { name: "신예 라이너", role: "LANE", note: "성장 곡선을 따라가기 좋음" },
      { name: "교전 메이커", role: "JUNGLE", note: "변수를 여는 유형" },
      { name: "팀파이트 딜러", role: "CARRY", note: "한타 집중력을 보는 포인트" },
    ],
    fanGuide: [
      "언더독 우승 서사 보기",
      "신예 선수 성장 기록 따라가기",
      "불리한 상황의 교전 선택을 보기",
    ],
    ratings: {
      입문난이도: 3,
      팬덤화력: 4,
      직관재미: 4,
      스토리성: 5,
      굿즈욕구: 4,
    },
  }),
  createTeam({
    id: "lck-ns",
    league: "lck",
    name: "농심 레드포스",
    shortName: "NS",
    home: "LCK Arena",
    logo: "https://cdn-api.pandascore.co/images/team/image/128217/nongshim_red_forcelogo_square.png",
    tone: "젊은 패기와 성장형 경기",
    intro:
      "성장하는 팀을 같이 응원하고 싶은 팬에게 잘 맞는 팀입니다.",
    entryPoint: "신예 선수들의 라인전과 과감한 교전을 중심으로 보세요.",
    tags: ["신예", "패기", "성장"],
    players: [
      { name: "신예 탑", role: "TOP", note: "과감한 라인전 선택" },
      { name: "공격형 바텀", role: "BOT", note: "초반 교전의 중심" },
      { name: "성장형 정글", role: "JUNGLE", note: "시즌 중 변화가 큰 유형" },
    ],
    fanGuide: [
      "신예 선수별 성장 포인트 보기",
      "초반 교전 선택을 따라가기",
      "승패보다 개선 흐름을 보면 재밌습니다.",
    ],
    ratings: {
      입문난이도: 3,
      팬덤화력: 3,
      직관재미: 4,
      스토리성: 4,
      굿즈욕구: 3,
    },
  }),
  createTeam({
    id: "lck-bfx",
    league: "lck",
    name: "BNK FEARX",
    shortName: "BFX",
    home: "LCK Arena",
    logo: "https://cdn-api.pandascore.co/images/team/image/134115/663px_fear_x_icon_lightmode.png",
    tone: "과감한 이름처럼 변수 많은 팀",
    intro:
      "새로운 팀 컬러와 반전 경기를 찾는 팬에게 맞습니다.",
    entryPoint: "초반 설계와 예상 밖 교전 장면을 중심으로 보세요.",
    tags: ["변수", "도전", "신선함"],
    players: [
      { name: "플레이메이커", role: "SUP", note: "경기 흐름을 여는 유형" },
      { name: "스노우볼 정글", role: "JUNGLE", note: "초반 이득을 굴림" },
      { name: "한타형 딜러", role: "BOT", note: "후반 집중력의 핵심" },
    ],
    fanGuide: [
      "초반 10분 설계를 보기",
      "예상 밖 픽과 교전 선택을 즐기기",
      "팀 컬러가 만들어지는 과정을 따라가기",
    ],
    ratings: {
      입문난이도: 3,
      팬덤화력: 3,
      직관재미: 4,
      스토리성: 4,
      굿즈욕구: 3,
    },
  }),
  createTeam({
    id: "lck-dns",
    league: "lck",
    name: "DN SOOPers",
    shortName: "DNS",
    home: "LCK Arena",
    logo: "https://cdn-api.pandascore.co/images/team/image/136063/dn_soo_perslogo_profile.png",
    tone: "새 이름과 새 팬덤의 시작점",
    intro:
      "팀이 자기 색을 만들어가는 과정을 같이 보고 싶은 팬에게 어울립니다.",
    entryPoint: "시즌 초반 경기와 로스터 조합을 따라가면 팀을 이해하기 쉽습니다.",
    tags: ["새출발", "로스터", "입문"],
    players: [
      { name: "팀 보이스 중심", role: "CALL", note: "운영 방향을 잡는 유형" },
      { name: "라인전 카드", role: "LANE", note: "초반 주도권의 핵심" },
      { name: "변수 메이커", role: "JUNGLE", note: "교전 각을 여는 선수군" },
    ],
    fanGuide: [
      "로스터 조합을 먼저 익히기",
      "운영 실수와 개선 흐름을 같이 보기",
      "새 팬덤 분위기를 함께 만들어가는 재미가 있습니다.",
    ],
    ratings: {
      입문난이도: 3,
      팬덤화력: 3,
      직관재미: 3,
      스토리성: 4,
      굿즈욕구: 3,
    },
  }),
  createTeam({
    id: "lck-bro",
    league: "lck",
    name: "HANJIN BRION",
    shortName: "BRO",
    home: "LCK Arena",
    logo: "https://cdn-api.pandascore.co/images/team/image/128218/628px_brion_2023_lightmode.png",
    tone: "밈, 진심, 한 방의 낭만",
    intro:
      "승패 밖의 재미와 팬덤 밈을 같이 즐기고 싶은 팬에게 강한 팀입니다.",
    entryPoint: "업셋 경기와 팬덤 밈을 같이 보면 왜 응원하는지 이해가 빠릅니다.",
    tags: ["업셋", "밈", "낭만"],
    players: [
      { name: "업셋 메이커", role: "CARRY", note: "강팀 상대로 빛나는 유형" },
      { name: "버티는 탑", role: "TOP", note: "불리한 구도를 견디는 선수군" },
      { name: "교전 서포터", role: "SUP", note: "한 번의 이니시를 보는 재미" },
    ],
    fanGuide: [
      "업셋 경기 하이라이트부터 보기",
      "팬덤 밈을 알고 보면 몰입이 커집니다.",
      "한 방의 승리를 기다리는 재미가 있습니다.",
    ],
    ratings: {
      입문난이도: 5,
      팬덤화력: 4,
      직관재미: 4,
      스토리성: 5,
      굿즈욕구: 4,
    },
  }),
];

export const TEAM_BY_ID = new Map(FEATURED_TEAMS.map((team) => [team.id, team]));

export const getTeamsByIds = (teamIds) =>
  teamIds.map((teamId) => TEAM_BY_ID.get(teamId)).filter(Boolean);
