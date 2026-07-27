const KLEAGUE_LOGO_BY_CODE = {
  K01: "https://www.kleague.com/assets/images/emblem/emblem_K01.png",
  K02: "https://www.kleague.com/assets/images/emblem/emblem_K02.png",
  K03: "https://www.kleague.com/assets/images/emblem/emblem_K03.png",
  K04: "https://www.kleague.com/assets/images/emblem/emblem_K04.png",
  K05: "https://www.kleague.com/assets/images/emblem/emblem_K05.png",
  K06: "https://www.kleague.com/assets/images/emblem/emblem_K06.png",
  K07: "https://www.kleague.com/assets/images/emblem/emblem_K07.png",
  K08: "https://www.kleague.com/assets/images/emblem/emblem_K08.png",
  K09: "https://www.kleague.com/assets/images/emblem/emblem_K09.png",
  K10: "https://www.kleague.com/assets/images/emblem/emblem_K10.png",
  K17: "https://www.kleague.com/assets/images/emblem/emblem_K17.png",
  K18: "https://www.kleague.com/assets/images/emblem/emblem_K18.png",
  K20: "https://www.kleague.com/assets/images/emblem/emblem_K20.png",
  K21: "https://www.kleague.com/assets/images/emblem/emblem_K21.png",
  K22: "https://www.kleague.com/assets/images/emblem/emblem_K22.png",
  K26: "https://www.kleague.com/assets/images/emblem/emblem_K26.png",
  K27: "https://www.kleague.com/assets/images/emblem/emblem_K27.png",
  K29: "https://www.kleague.com/assets/images/emblem/emblem_K29.png",
  K31: "https://www.kleague.com/assets/images/emblem/emblem_K31.png",
  K32: "https://www.kleague.com/assets/images/emblem/emblem_K32.png",
  K34: "https://www.kleague.com/assets/images/emblem/emblem_K34.png",
  K35: "https://www.kleague.com/assets/images/emblem/emblem_K35.png",
  K36: "https://www.kleague.com/assets/images/emblem/emblem_K36.png",
  K37: "https://www.kleague.com/assets/images/emblem/emblem_K37.png",
  K38: "https://www.kleague.com/assets/images/emblem/emblem_K38.png",
  K39: "https://www.kleague.com/assets/images/emblem/emblem_K39.png",
  K40: "https://www.kleague.com/assets/images/emblem/emblem_K40.png",
  K41: "https://www.kleague.com/assets/images/emblem/emblem_K41.png",
  K42: "https://www.kleague.com/assets/images/emblem/emblem_K42.png",
};

const createKLeagueTeam = (code, name, shortName) => ({
  name,
  shortName,
  logo: KLEAGUE_LOGO_BY_CODE[code] ?? "",
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

const KBO_RECORD_TEAM_ALIASES = {
  HH: "HANWHA",
  HT: "KIA",
  LT: "LOTTE",
  OB: "DOOSAN",
  SK: "SSG",
  SS: "SAMSUNG",
  WO: "KIWOOM",
};

Object.entries(KBO_RECORD_TEAM_ALIASES).forEach(([alias, teamCode]) => {
  TEAM_INFO[alias] = TEAM_INFO[teamCode];
});

const LCK_TEAM_INFO = {
  T1: {
    name: "T1",
    shortName: "T1",
    logo: "https://nng-phinf.pstatic.net/MjAyNjAzMjRfMTI0/MDAxNzc0MzE2NTQwOTMy.sD4W1TV6YEDKDROC5eqENCioxO0kVLNxiHiqQ490CnIg.nHRkoW5dIZcZmQc4z8kclbMG9lYBZ0uwdAUmjREEAVsg.PNG/VkiBHqtbvmkZKDqjqCmu.png",
  },
  GEN: {
    name: "Gen.G",
    shortName: "GEN",
    logo: "https://nng-phinf.pstatic.net/MjAyNjAzMjZfMzkg/MDAxNzc0NDkwNjY2NjE1.zDvZThJm_sHxsK8wIZAlAfRk8b1SB1GKv0perWFijyYg.yDnZRcL6eJUjc4IjgERUaj5Cy2Pr4yO_r4B36l0UPRkg.PNG/DBHaqbmQDncktllRKrbc.png",
  },
  HLE: {
    name: "한화생명 e스포츠",
    shortName: "HLE",
    logo: "https://nng-phinf.pstatic.net/MjAyNjA3MTJfMjI3/MDAxNzgzODU3MjY2MTM0.dhmJ5HWXbugQpiT6LBZ9mM13pqZeqq4ZYG95PvI2YxYg.fH-mWmPIMY8nXn0FUxCYM34WZN_Ac-tc8uJxyceYd6wg.PNG/eZUyKwkSXULgzlbQMxrA.png",
  },
  DK: {
    name: "Dplus KIA",
    shortName: "DK",
    logo: "https://nng-phinf.pstatic.net/MjAyNjA3MjBfNzMg/MDAxNzg0NDc2MzQ4NDI2.Ji_yUu0Zk7ctXv0XoKblES54_tgPXwGgUhd7PlxbFK0g.KASyeELcViNMgVyvRJcbI8mLArQYfgFOTLuDvVoHGA0g.PNG/CPeTQqNlTeigtkDBMerH.png",
  },
  KT: {
    name: "KT Rolster",
    shortName: "KT",
    logo: "https://nng-phinf.pstatic.net/MjAyNjAzMjRfMTM1/MDAxNzc0MzEyMTAxNTI1.tU2Xz64pHrm-d51AhdIn6Il2_hWpVy7YYQvW8sMjvnQg.5J4xJy2rwAeb-wdWl4HYUXwVtKSjfyDhOsNfFqT16nAg.PNG/ALKKqVzGRmOyiGTHSmfs.png",
  },
  KRX: {
    name: "Kiwoom DRX",
    shortName: "KRX",
    logo: "https://nng-phinf.pstatic.net/MjAyNjAzMjZfOCAg/MDAxNzc0NDkwNjYyNTQ2.2h0KNNJtT7g5IkHNkHi4WZA8g5sm_6ovRJRX1BlTQ9gg.Alvr_MFBsOuxPhDBsZGyvO3Tp3NgzE1YOn_ZLyWpFaMg.PNG/jJvJIADpUGdYHilKlVjf.png",
  },
  NS: {
    name: "농심 레드포스",
    shortName: "NS",
    logo: "https://nng-phinf.pstatic.net/MjAyNjAzMTdfMTk5/MDAxNzczNzIzNTIzOTY1.1kN8H9ghX8ZImullRRHjU7RkBscSXoow5GvgkuGp8Qsg.F7jheVIbDPlbMNWXdwkVu5q1H6DLFpdDthmQnL5S1k8g.PNG/QoeyPExxiAbWNaNPehsX.png",
  },
  BFX: {
    name: "BNK FEARX",
    shortName: "BFX",
    logo: "https://nng-phinf.pstatic.net/MjAyNjAzMTdfMjA2/MDAxNzczNzIzNTIwODg1.E4xzk8GK_m89gsIyGEYMnrBTTDcuz1ApobZi22PRypkg.IdRBc1yVQgZeuhqHLxbEvsT119H9JdmpJbDeOgrDkTwg.PNG/BduFugEHslpyXsMErfqN.png",
  },
  DNS: {
    name: "DN SOOPers",
    shortName: "DNS",
    logo: "https://nng-phinf.pstatic.net/MjAyNjA1MTlfMjMz/MDAxNzc5MTYyODY2MTQ4.KRZlY5Op5eD10uSpzxDddY0KXWhZPYWsWZuaMU0G_Qog.NemiQ17_HFqdE_dYX-XjGEDBEF7Z2JyvbWaXrwRqOuEg.PNG/WzLcoLybehRZuVmXjTrI.png",
  },
  BRO: {
    name: "HANJIN BRION",
    shortName: "BRO",
    logo: "https://nng-phinf.pstatic.net/MjAyNjAzMzBfMTU3/MDAxNzc0ODU4NzAyNDc5.FVWEA8oEE51Tyzo21jhzv0T7J553DiNQxWgjHidCRmIg.uiiwl3EPUuALw7W_-ZKSm66cOqFf3niRYgaFAfRZzHQg.PNG/YJMNtDUEHizlgjYWMAbE.png",
  },
};

const LCK_RECORD_TEAM_ALIASES = {
  R105: "KT",
  R479: "GEN",
  R480: "HLE",
  R1040: "T1",
  R1041: "KRX",
  R1070: "BFX",
  R1071: "BRO",
  R1072: "NS",
  R1118: "DNS",
  R1152: "DK",
};

Object.entries(LCK_RECORD_TEAM_ALIASES).forEach(([alias, teamCode]) => {
  LCK_TEAM_INFO[alias] = LCK_TEAM_INFO[teamCode];
});

const normalizeTeamLookupKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s._\-()/]+/g, "");

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
  const kLeagueCode =
    sport === "soccer" && /^\d+$/.test(directCode)
      ? `K${directCode.padStart(2, "0")}`
      : "";

  const teamInfo =
    sport === "esports"
      ? LCK_TEAM_INFO[directCode] ?? LCK_TEAM_LOOKUP.get(normalizedCode)
      : TEAM_INFO[directCode] ??
        TEAM_INFO[kLeagueCode] ??
        TEAM_LOOKUP.get(normalizedCode);

  return (
    teamInfo ?? {
      name: teamCode || "미정",
      shortName: teamCode || "-",
      logo: "",
    }
  );
};
