import { supabase } from "../../../lib/supabase";

const CALENDAR_TABLE = "matches";

const SPORT_CONFIGS = {
  baseball: {
    sport: "baseball",
    sportLabel: "BASEBALL",
    leagueLabel: "KBO",
    dbSport: "baseball",
  },
  soccer: {
    sport: "soccer",
    sportLabel: "SOCCER",
    leagueLabel: "K LEAGUE",
    dbSport: "soccer",
  },
  lol: {
    sport: "lol",
    sportLabel: "LOL",
    leagueLabel: "LCK",
    dbSport: "esports",
  },
};

const KBO_TEAM_INFO = {
  DOOSAN: { name: "두산 베어스", shortName: "DOOSAN", logo: "/logos/doosan.png" },
  LG: { name: "LG 트윈스", shortName: "LG", logo: "/logos/lg.png" },
  KIA: { name: "KIA 타이거즈", shortName: "KIA", logo: "/logos/kia.png" },
  KT: { name: "KT 위즈", shortName: "KT", logo: "/logos/kt.png" },
  LOTTE: { name: "롯데 자이언츠", shortName: "LOTTE", logo: "/logos/lotte.png" },
  NC: { name: "NC 다이노스", shortName: "NC", logo: "/logos/nc.png" },
  SAMSUNG: { name: "삼성 라이온즈", shortName: "SAMSUNG", logo: "/logos/samsung.png" },
  SSG: { name: "SSG 랜더스", shortName: "SSG", logo: "/logos/ssg.png" },
  HANWHA: { name: "한화 이글스", shortName: "HANWHA", logo: "/logos/hanwha.png" },
  KIWOOM: { name: "키움 히어로즈", shortName: "KIWOOM", logo: "/logos/kiwoom.png" },
};

const KLEAGUE_LOGO_URL = "https://www.kleague.com/assets/images/emblem";

const KLEAGUE_TEAM_INFO = {
  K01: { name: "울산", shortName: "울산", logo: `${KLEAGUE_LOGO_URL}/emblem_K01.png` },
  K02: { name: "수원", shortName: "수원", logo: `${KLEAGUE_LOGO_URL}/emblem_K02.png` },
  K03: { name: "포항", shortName: "포항", logo: `${KLEAGUE_LOGO_URL}/emblem_K03.png` },
  K04: { name: "제주", shortName: "제주", logo: `${KLEAGUE_LOGO_URL}/emblem_K04.png` },
  K05: { name: "전북", shortName: "전북", logo: `${KLEAGUE_LOGO_URL}/emblem_K05.png` },
  K06: { name: "부산", shortName: "부산", logo: `${KLEAGUE_LOGO_URL}/emblem_K06.png` },
  K07: { name: "대구", shortName: "대구", logo: `${KLEAGUE_LOGO_URL}/emblem_K07.png` },
  K08: { name: "광주", shortName: "광주", logo: `${KLEAGUE_LOGO_URL}/emblem_K08.png` },
  K09: { name: "서울", shortName: "서울", logo: `${KLEAGUE_LOGO_URL}/emblem_K09.png` },
  K10: { name: "대전", shortName: "대전", logo: `${KLEAGUE_LOGO_URL}/emblem_K10.png` },
  K17: { name: "대구FC", shortName: "대구FC", logo: `${KLEAGUE_LOGO_URL}/emblem_K17.png` },
  K18: { name: "인천", shortName: "인천", logo: `${KLEAGUE_LOGO_URL}/emblem_K18.png` },
  K20: { name: "경남", shortName: "경남", logo: `${KLEAGUE_LOGO_URL}/emblem_K20.png` },
  K21: { name: "강원", shortName: "강원", logo: `${KLEAGUE_LOGO_URL}/emblem_K21.png` },
  K22: { name: "광주FC", shortName: "광주FC", logo: `${KLEAGUE_LOGO_URL}/emblem_K22.png` },
  K26: { name: "부천", shortName: "부천", logo: `${KLEAGUE_LOGO_URL}/emblem_K26.png` },
  K27: { name: "안양", shortName: "안양", logo: `${KLEAGUE_LOGO_URL}/emblem_K27.png` },
  K29: { name: "수원FC", shortName: "수원FC", logo: `${KLEAGUE_LOGO_URL}/emblem_K29.png` },
  K31: { name: "서울E", shortName: "서울E", logo: `${KLEAGUE_LOGO_URL}/emblem_K31.png` },
  K32: { name: "안산", shortName: "안산", logo: `${KLEAGUE_LOGO_URL}/emblem_K32.png` },
  K34: { name: "충남아산", shortName: "충남아산", logo: `${KLEAGUE_LOGO_URL}/emblem_K34.png` },
  K35: { name: "김천", shortName: "김천", logo: `${KLEAGUE_LOGO_URL}/emblem_K35.png` },
  K36: { name: "김포", shortName: "김포", logo: `${KLEAGUE_LOGO_URL}/emblem_K36.png` },
  K37: { name: "충북청주", shortName: "충북청주", logo: `${KLEAGUE_LOGO_URL}/emblem_K37.png` },
  K38: { name: "천안", shortName: "천안", logo: `${KLEAGUE_LOGO_URL}/emblem_K38.png` },
  K39: { name: "부산", shortName: "부산", logo: `${KLEAGUE_LOGO_URL}/emblem_K39.png` },
  K40: { name: "부산아이파크", shortName: "부산", logo: `${KLEAGUE_LOGO_URL}/emblem_K40.png` },
  K41: { name: "김천상무", shortName: "김천", logo: `${KLEAGUE_LOGO_URL}/emblem_K41.png` },
  K42: { name: "화성", shortName: "화성", logo: `${KLEAGUE_LOGO_URL}/emblem_K42.png` },
};

const LCK_TEAM_INFO = {
  T1: { name: "T1", shortName: "T1", logo: "https://cdn-api.pandascore.co/images/team/image/126061/t_oscq04.png" },
  GEN: { name: "Gen.G", shortName: "GEN", logo: "https://cdn-api.pandascore.co/images/team/image/2882/699px_gen.g_esports_2026_allmode.png" },
  HLE: { name: "Hanwha Life Esports", shortName: "HLE", logo: "https://cdn-api.pandascore.co/images/team/image/2883/hanwha-life-esports-1s04vbu0.png" },
  DK: { name: "Dplus KIA", shortName: "DK", logo: "https://cdn-api.pandascore.co/images/team/image/132531/800px_dplus_lightmode.png" },
  KT: { name: "KT Rolster", shortName: "KT", logo: "https://cdn-api.pandascore.co/images/team/image/63/kt_rolsterlogo_profile.png" },
  KRX: { name: "Kiwoom DRX", shortName: "KRX", logo: "https://cdn-api.pandascore.co/images/team/image/126370/220px_dr_xlogo_square.png" },
  NS: { name: "Nongshim RedForce", shortName: "NS", logo: "https://cdn-api.pandascore.co/images/team/image/128217/nongshim_red_forcelogo_square.png" },
  BFX: { name: "BNK FEARX", shortName: "BFX", logo: "https://cdn-api.pandascore.co/images/team/image/134115/663px_fear_x_icon_lightmode.png" },
  DNS: { name: "DN SOOPers", shortName: "DNS", logo: "https://cdn-api.pandascore.co/images/team/image/136063/dn_soo_perslogo_profile.png" },
  BRO: { name: "BRION", shortName: "BRO", logo: "https://cdn-api.pandascore.co/images/team/image/128218/628px_brion_2023_lightmode.png" },
};

const EXCLUDED_KBO_TEAM_CODES = new Set(["NANUM", "DREAM"]);

const formatMatchTime = (time) => {
  if (!time) return "TBD";

  const raw = String(time).trim();
  if (!raw || raw.toUpperCase() === "TBD") return "TBD";

  return raw.slice(0, 5);
};

const toSortTimestamp = (date, time) => {
  if (!date) return 0;

  const normalizedTime = time === "TBD" ? "00:00:00" : `${time}:00`;
  const timestamp = new Date(`${date}T${normalizedTime}`);
  return Number.isNaN(timestamp.getTime()) ? 0 : timestamp.getTime();
};

const parseScore = (score, index) => {
  if (typeof score !== "string" || !score.includes(":")) return null;
  const values = score.split(":").map((value) => Number(value));
  return Number.isFinite(values[index]) ? values[index] : null;
};

const getTeamInfo = (teamCode, sport, fallbackName = "", fallbackLogo = "") => {
  const normalizedCode = String(teamCode || "").trim().toUpperCase();

  if (fallbackName || fallbackLogo) {
    return {
      code: normalizedCode || teamCode || "-",
      name: fallbackName || normalizedCode || teamCode || "-",
      shortName: normalizedCode || teamCode || "-",
      logo: fallbackLogo || "",
    };
  }

  if (sport === "esports") {
    return (
      LCK_TEAM_INFO[normalizedCode] || {
        code: normalizedCode || teamCode || "-",
        name: normalizedCode || teamCode || "-",
        shortName: normalizedCode || teamCode || "-",
        logo: "",
      }
    );
  }

  if (sport === "soccer") {
    const teamInfo = KLEAGUE_TEAM_INFO[normalizedCode];
    if (teamInfo) {
      return { code: normalizedCode, ...teamInfo };
    }

    return {
      code: normalizedCode || teamCode || "-",
      name: normalizedCode || teamCode || "-",
      shortName: normalizedCode || teamCode || "-",
      logo: normalizedCode ? `${KLEAGUE_LOGO_URL}/emblem_${normalizedCode}.png` : "",
    };
  }

  return (
    KBO_TEAM_INFO[normalizedCode] || {
      code: normalizedCode || teamCode || "-",
      name: normalizedCode || teamCode || "-",
      shortName: normalizedCode || teamCode || "-",
      logo: "",
    }
  );
};

const normalizeRowToMatch = (row, sportConfig) => {
  if (
    sportConfig.sport === "baseball" &&
    [row.home_team_code, row.away_team_code].some((teamCode) =>
      EXCLUDED_KBO_TEAM_CODES.has(String(teamCode || "").trim().toUpperCase()),
    )
  ) {
    return null;
  }

  const homeTeam = getTeamInfo(
    row.home_team_code,
    row.sport,
    row.home_team_name,
    row.home_team_logo,
  );
  const awayTeam = getTeamInfo(
    row.away_team_code,
    row.sport,
    row.away_team_name,
    row.away_team_logo,
  );

  return {
    id: row.external_id || row.id,
    date: row.match_date,
    sport: sportConfig.sport,
    sportLabel: sportConfig.sportLabel,
    league: row.league || sportConfig.leagueLabel,
    time: formatMatchTime(row.match_time),
    venue: row.venue || "",
    homeTeam,
    awayTeam,
    homeScore: parseScore(row.score, 1),
    awayScore: parseScore(row.score, 0),
    statusCode: row.status || "scheduled",
    statusInfo: row.status || "scheduled",
    reversedHomeAway: false,
    broadcast: row.broadcast || "",
    note: row.note || "",
    gameType: row.game_type || "",
  };
};

export const groupMatchesByDate = (matches = []) =>
  matches.reduce((acc, match) => {
    if (!acc[match.date]) acc[match.date] = [];
    acc[match.date].push(match);
    return acc;
  }, {});

export const fetchKBOSchedule = async ({ sport = "baseball", fromDate, toDate, signal }) => {
  const sportConfig = SPORT_CONFIGS[sport];

  if (!sportConfig) {
    return { meta: null, matches: [], matchByDate: {} };
  }

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const { data, error } = await supabase
    .from(CALENDAR_TABLE)
    .select("*")
    .eq("sport", sportConfig.dbSport)
    .gte("match_date", fromDate)
    .lte("match_date", toDate)
    .order("match_date", { ascending: true })
    .order("match_time", { ascending: true });

  if (error) {
    throw error;
  }

  const matches = (data || [])
    .map((row) => normalizeRowToMatch(row, sportConfig))
    .filter(Boolean);

  matches.sort((a, b) => toSortTimestamp(a.date, a.time) - toSortTimestamp(b.date, b.time));

  return {
    meta: {
      seasonYear: fromDate ? Number(fromDate.slice(0, 4)) : null,
      categoryId: sportConfig.dbSport,
      upperCategoryId: sportConfig.dbSport,
      month: fromDate ? Number(fromDate.slice(5, 7)) : null,
      today: null,
      selectedDate: fromDate || null,
      source: "supabase",
    },
    matches,
    matchByDate: groupMatchesByDate(matches),
  };
};
