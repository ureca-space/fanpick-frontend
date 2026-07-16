const SPORT_CONFIGS = {
  baseball: {
    sport: "baseball",
    sportLabel: "BASEBALL",
    leagueLabel: "KBO League",
    categoryId: "kbo",
    upperCategoryId: "kbaseball",
    fields: "basic,schedule,baseball,manualRelayUrl",
  },
  soccer: {
    sport: "soccer",
    sportLabel: "SOCCER",
    leagueLabel: "K League 1",
    categoryId: "kleague",
    upperCategoryId: "kfootball",
    fields: "basic,schedule,football,manualRelayUrl",
  },
  basketball: {
    sport: "basketball",
    sportLabel: "BASKETBALL",
    leagueLabel: "KBL",
    categoryId: "kbl",
    upperCategoryId: "kbasketball",
    fields: "basic,schedule,basketball,manualRelayUrl",
  },
};

const formatGameTime = (gameDateTime, timeTbd) => {
  if (timeTbd || !gameDateTime) {
    return "TBD";
  }

  const time = new Date(gameDateTime);

  if (Number.isNaN(time.getTime())) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(time);
};

const toSortTimestamp = (date, time) => {
  if (!date) {
    return 0;
  }

  const normalizedTime = time === "TBD" ? "00:00:00" : `${time}:00`;
  const timestamp = new Date(`${date}T${normalizedTime}`);

  return Number.isNaN(timestamp.getTime()) ? 0 : timestamp.getTime();
};

export const mapNaverGameToMatch = (game, teamMap = {}, sportConfig) => {
  const homeTeam = teamMap[game.homeTeamCode];
  const awayTeam = teamMap[game.awayTeamCode];

  return {
    id: game.gameId,
    date: game.gameDate,
    sport: sportConfig.sport,
    sportLabel: sportConfig.sportLabel,
    league: sportConfig.leagueLabel,
    time: formatGameTime(game.gameDateTime, game.timeTbd),
    venue: game.stadium ?? "",
    homeTeam: {
      code: game.homeTeamCode,
      name: game.homeTeamName,
      shortName: game.homeTeamName,
      logo: game.homeTeamEmblemUrl ?? homeTeam?.logoThumbnail ?? "",
    },
    awayTeam: {
      code: game.awayTeamCode,
      name: game.awayTeamName,
      shortName: game.awayTeamName,
      logo: game.awayTeamEmblemUrl ?? awayTeam?.logoThumbnail ?? "",
    },
    homeScore: game.homeTeamScore,
    awayScore: game.awayTeamScore,
    statusCode: game.statusCode,
    statusInfo: game.statusInfo,
    reversedHomeAway: Boolean(game.reversedHomeAway),
  };
};

export const groupMatchesByDate = (matches = []) => {
  return matches.reduce((acc, match) => {
    if (!acc[match.date]) {
      acc[match.date] = [];
    }

    acc[match.date].push(match);
    return acc;
  }, {});
};

export const fetchKBOSchedule = async ({ sport = "baseball", fromDate, toDate, signal }) => {
  const sportConfig = SPORT_CONFIGS[sport];

  if (!sportConfig) {
    return {
      meta: null,
      matches: [],
      matchByDate: {},
    };
  }

  const requestUrl = new URL("/api/kbo-schedule", window.location.origin);
  requestUrl.searchParams.set("fields", sportConfig.fields);
  requestUrl.searchParams.set("upperCategoryId", sportConfig.upperCategoryId);
  requestUrl.searchParams.set("categoryId", sportConfig.categoryId);
  requestUrl.searchParams.set("fromDate", fromDate);
  requestUrl.searchParams.set("toDate", toDate);
  requestUrl.searchParams.set("roundCodes", "");
  requestUrl.searchParams.set("size", "500");

  const response = await fetch(requestUrl.toString(), { signal });

  if (!response.ok) {
    throw new Error("KBO schedule request failed.");
  }

  const payload = await response.json();
  const result = payload?.result ?? payload;
  const teamMap = Object.fromEntries(
    (result?.teams ?? []).map((team) => [
      team.teamCode ?? team.teamId ?? team.nameAcronym ?? team.nameEngAcronym,
      team,
    ]),
  );
  const rawMatches = result?.games ?? [];
  const games = rawMatches.map((game) =>
    mapNaverGameToMatch(game, teamMap, sportConfig),
  );

  games.sort(
    (a, b) => toSortTimestamp(a.date, a.time) - toSortTimestamp(b.date, b.time),
  );

  return {
    meta: {
      seasonYear: result?.seasonYear ?? null,
      categoryId: result?.categoryId ?? null,
      upperCategoryId: result?.upperCategoryId ?? null,
      month: result?.month ?? null,
      today: result?.today ?? null,
      selectedDate: result?.selectedDate ?? fromDate,
    },
    matches: games,
    matchByDate: groupMatchesByDate(games),
  };
};
