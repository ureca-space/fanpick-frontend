const KLEAGUE_LOGO_URL = "https://www.kleague.com/assets/images/emblem";

const createKLeagueTeam = (code, name, shortName) => ({
  name,
  shortName,
  logo: `${KLEAGUE_LOGO_URL}/emblem_${code}.png`,
});

const TEAM_INFO = {
  // KBO
  DOOSAN: {
    name: "두산 베어스",
    shortName: "DOOSAN",
    logo: "/logos/doosan.png",
  },
  NC: {
    name: "NC 다이노스",
    shortName: "NC",
    logo: "/logos/nc.png",
  },
  LG: {
    name: "LG 트윈스",
    shortName: "LG",
    logo: "/logos/lg.png",
  },
  KIA: {
    name: "KIA 타이거즈",
    shortName: "KIA",
    logo: "/logos/kia.png",
  },
  SAMSUNG: {
    name: "삼성 라이온즈",
    shortName: "SAMSUNG",
    logo: "/logos/samsung.png",
  },
  LOTTE: {
    name: "롯데 자이언츠",
    shortName: "LOTTE",
    logo: "/logos/lotte.png",
  },
  HANWHA: {
    name: "한화 이글스",
    shortName: "HANWHA",
    logo: "/logos/hanwha.png",
  },
  SSG: {
    name: "SSG 랜더스",
    shortName: "SSG",
    logo: "/logos/ssg.png",
  },
  KIWOOM: {
    name: "키움 히어로즈",
    shortName: "KIWOOM",
    logo: "/logos/kiwoom.png",
  },
  KT: {
    name: "KT 위즈",
    shortName: "KT",
    logo: "/logos/kt.png",
  },

  // K리그
  K01: createKLeagueTeam("K01", "울산 HD FC", "울산"),
  K02: createKLeagueTeam("K02", "수원 삼성 블루윙즈", "수원"),
  K03: createKLeagueTeam("K03", "포항 스틸러스", "포항"),
  K04: createKLeagueTeam("K04", "제주SK FC", "제주"),
  K05: createKLeagueTeam("K05", "전북 현대 모터스", "전북"),
  K06: createKLeagueTeam("K06", "부산 아이파크", "부산"),
  K07: createKLeagueTeam("K07", "전남 드래곤즈", "전남"),
  K08: createKLeagueTeam("K08", "성남 FC", "성남"),
  K09: createKLeagueTeam("K09", "FC 서울", "서울"),
  K10: createKLeagueTeam("K10", "대전 하나시티즌", "대전"),
  K17: createKLeagueTeam("K17", "대구 FC", "대구"),
  K18: createKLeagueTeam("K18", "인천 유나이티드", "인천"),
  K20: createKLeagueTeam("K20", "경남 FC", "경남"),
  K21: createKLeagueTeam("K21", "강원 FC", "강원"),
  K22: createKLeagueTeam("K22", "광주 FC", "광주"),
  K26: createKLeagueTeam("K26", "부천 FC 1995", "부천"),
  K27: createKLeagueTeam("K27", "FC 안양", "안양"),
  K29: createKLeagueTeam("K29", "수원 FC", "수원FC"),
  K31: createKLeagueTeam("K31", "서울 이랜드 FC", "서울E"),
  K32: createKLeagueTeam("K32", "안산 그리너스 FC", "안산"),
  K34: createKLeagueTeam("K34", "충남아산 FC", "충남아산"),
  K35: createKLeagueTeam("K35", "김천 상무", "김천"),
  K36: createKLeagueTeam("K36", "김포 FC", "김포"),
  K37: createKLeagueTeam("K37", "충북청주 FC", "충북청주"),
  K38: createKLeagueTeam("K38", "천안 시티 FC", "천안"),
  K39: createKLeagueTeam("K39", "화성 FC", "화성"),
  K40: createKLeagueTeam("K40", "파주프런티어FC", "파주"),
  K41: createKLeagueTeam("K41", "김해FC2008", "김해"),
  K42: createKLeagueTeam("K42", "용인FC", "용인"),
};

const LCK_TEAM_INFO = {
  T1: {
    name: "T1",
    shortName: "T1",
    logo: "https://cdn-api.pandascore.co/images/team/image/126061/t_oscq04.png",
  },
  GEN: {
    name: "Gen.G",
    shortName: "GEN",
    logo: "https://cdn-api.pandascore.co/images/team/image/2882/699px_gen.g_esports_2026_allmode.png",
  },
  HLE: {
    name: "한화생명 e스포츠",
    shortName: "HLE",
    logo: "https://cdn-api.pandascore.co/images/team/image/2883/hanwha-life-esports-1s04vbu0.png",
  },
  DK: {
    name: "Dplus KIA",
    shortName: "DK",
    logo: "https://cdn-api.pandascore.co/images/team/image/132531/800px_dplus_lightmode.png",
  },
  KT: {
    name: "KT Rolster",
    shortName: "KT",
    logo: "https://cdn-api.pandascore.co/images/team/image/63/kt_rolsterlogo_profile.png",
  },
  KRX: {
    name: "Kiwoom DRX",
    shortName: "KRX",
    logo: "https://cdn-api.pandascore.co/images/team/image/126370/220px_dr_xlogo_square.png",
  },
  NS: {
    name: "농심 레드포스",
    shortName: "NS",
    logo: "https://cdn-api.pandascore.co/images/team/image/128217/nongshim_red_forcelogo_square.png",
  },
  BFX: {
    name: "BNK FEARX",
    shortName: "BFX",
    logo: "https://cdn-api.pandascore.co/images/team/image/134115/663px_fear_x_icon_lightmode.png",
  },
  DNS: {
    name: "DN SOOPers",
    shortName: "DNS",
    logo: "https://cdn-api.pandascore.co/images/team/image/136063/dn_soo_perslogo_profile.png",
  },
  BRO: {
    name: "HANJIN BRION",
    shortName: "BRO",
    logo: "https://cdn-api.pandascore.co/images/team/image/128218/628px_brion_2023_lightmode.png",
  },
};

const normalizeTeamLookupKey = (value) => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s._\-()/]+/g, "");
};

const buildTeamLookup = (teamInfo) => {
  const lookup = new Map();

  Object.entries(teamInfo).forEach(([code, info]) => {
    [code, info?.name, info?.shortName]
      .filter(Boolean)
      .map(normalizeTeamLookupKey)
      .forEach((key) => {
        if (!lookup.has(key)) {
          lookup.set(key, info);
        }
      });
  });

  return lookup;
};

const TEAM_LOOKUP = buildTeamLookup(TEAM_INFO);
const LCK_TEAM_LOOKUP = buildTeamLookup(LCK_TEAM_INFO);

export const getTeamInfo = (teamCode, sport) => {
  const directCode = String(teamCode ?? "").trim().toUpperCase();
  const normalizedCode = normalizeTeamLookupKey(teamCode);

  const teamInfo =
    sport === "esports"
      ? LCK_TEAM_INFO[directCode] ?? LCK_TEAM_LOOKUP.get(normalizedCode)
      : TEAM_INFO[directCode] ?? TEAM_LOOKUP.get(normalizedCode);

  return (
    teamInfo ?? {
      name: teamCode || "미정",
      shortName: teamCode || "-",
      logo: "",
    }
  );
};
