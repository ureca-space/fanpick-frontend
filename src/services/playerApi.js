const API_KEY = import.meta.env.VITE_SPORTSDB_API_KEY || "123";
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;
const WIKIPEDIA_LANGUAGES = ["ko", "en"];

const SPORT_NAME_MAP = {
  soccer: "soccer",
  baseball: "baseball",
  basketball: "basketball",
  lol: "esports",
};

const normalizeText = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "")
    .trim();

const getUniqueValues = (values) =>
  [...new Set(values.filter((value) => Boolean(value?.trim())))];

const normalizePlayer = (player) => {
  if (!player) return null;

  const imageCandidates = getUniqueValues([player.strThumb]);

  return {
    id: player.idPlayer || "",
    name: player.strPlayer || "",
    team: player.strTeam || "",
    sport: player.strSport || "",
    position: player.strPosition || "",
    number: player.strNumber || "",
    nationality: player.strNationality || "",
    birthDate: player.dateBorn || "",
    height: player.strHeight || "",
    weight: player.strWeight || "",
    image: imageCandidates[0] || "",
    imageCandidates,
  };
};

const requestPlayerApi = async (endpoint) => {
  const response = await fetch(`${BASE_URL}/${endpoint}`);

  if (!response.ok) {
    throw new Error(`선수 정보 요청 실패: ${response.status}`);
  }

  return response.json();
};

const getWikidataImage = async (wikidataId) => {
  if (!wikidataId) {
    return "";
  }

  const params = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    origin: "*",
    ids: wikidataId,
    props: "claims",
  });

  const response = await fetch(
    `https://www.wikidata.org/w/api.php?${params.toString()}`,
  );

  if (!response.ok) {
    return "";
  }

  const data = await response.json();
  const fileName =
    data.entities?.[wikidataId]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;

  if (!fileName) {
    return "";
  }

  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    fileName,
  )}?width=900`;
};

const getWikipediaPageImage = async (title, language) => {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    prop: "pageimages|pageprops",
    piprop: "original|thumbnail",
    pithumbsize: "900",
    redirects: "1",
    titles: title,
  });

  const response = await fetch(
    `https://${language}.wikipedia.org/w/api.php?${params.toString()}`,
  );

  if (!response.ok) {
    return "";
  }

  const data = await response.json();
  const pages = Object.values(data.query?.pages || {});
  const page = pages.find((candidate) => !candidate.missing);
  const image = page?.original?.source || page?.thumbnail?.source || "";

  if (image) {
    return image;
  }

  return getWikidataImage(page?.pageprops?.wikibase_item);
};

const getWikipediaSummaryImage = async (title, language) => {
  const encodedTitle = encodeURIComponent(title.replaceAll(" ", "_"));
  const response = await fetch(
    `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`,
  );

  if (!response.ok) {
    return "";
  }

  const data = await response.json();

  return data.originalimage?.source || data.thumbnail?.source || "";
};

const getWikipediaImage = async (title, language) => {
  try {
    const pageImage = await getWikipediaPageImage(title, language);

    if (pageImage) {
      return pageImage;
    }

    return getWikipediaSummaryImage(title, language);
  } catch {
    return "";
  }
};

const fetchFallbackPlayerImage = async (player) => {
  const explicitTitles = player.wikipediaTitles || player.wikipediaTitle;
  const titles = Array.isArray(explicitTitles)
    ? explicitTitles
    : [explicitTitles, player.searchName, player.name];

  for (const title of getUniqueValues(titles)) {
    const languages = title === player.name ? WIKIPEDIA_LANGUAGES : ["en", "ko"];

    for (const language of languages) {
      const image = await getWikipediaImage(title, language);

      if (image) {
        return image;
      }
    }
  }

  return "";
};

export const fetchPlayerById = async (playerId) => {
  if (!playerId?.trim()) {
    return null;
  }

  const data = await requestPlayerApi(
    `lookupplayer.php?id=${encodeURIComponent(playerId)}`,
  );

  return normalizePlayer(data.players?.[0]);
};

export const fetchPlayerByName = async (
  playerName,
  { expectedSport = "", expectedTeam = "" } = {},
) => {
  if (!playerName?.trim()) {
    throw new Error("선수 이름이 필요합니다.");
  }

  const data = await requestPlayerApi(
    `searchplayers.php?p=${encodeURIComponent(playerName)}`,
  );

  const players = data.player || [];

  if (players.length === 0) {
    return null;
  }

  const normalizedPlayerName = normalizeText(playerName);
  const normalizedExpectedSport = normalizeText(
    SPORT_NAME_MAP[expectedSport] || expectedSport,
  );
  const normalizedExpectedTeam = normalizeText(expectedTeam);

  const exactNamePlayers = players.filter(
    (player) => normalizeText(player.strPlayer) === normalizedPlayerName,
  );

  const nameMatchedPlayers =
    exactNamePlayers.length > 0 ? exactNamePlayers : players;

  const sportMatchedPlayers = normalizedExpectedSport
    ? nameMatchedPlayers.filter(
        (player) => normalizeText(player.strSport) === normalizedExpectedSport,
      )
    : nameMatchedPlayers;

  const teamMatchedPlayers = normalizedExpectedTeam
    ? sportMatchedPlayers.filter((player) =>
        normalizeText(player.strTeam).includes(normalizedExpectedTeam),
      )
    : sportMatchedPlayers;

  const matchedPlayers =
    teamMatchedPlayers.length > 0
      ? teamMatchedPlayers
      : sportMatchedPlayers.length > 0
        ? sportMatchedPlayers
        : [];

  /*
   * 정확하게 검증할 수 없는 결과는 사용하지 않는다.
   * 엉뚱한 선수의 사진과 소속팀이 표시되는 것을 방지한다.
   */
  if (matchedPlayers.length !== 1) {
    return null;
  }

  return normalizePlayer(matchedPlayers[0]);
};

export const fetchPlayer = async (player) => {
  if (!player) {
    return null;
  }

  /*
   * 정확한 TheSportsDB ID가 있으면 이름 검색보다 우선한다.
   */
  const apiPlayer = player.apiId
    ? await fetchPlayerById(String(player.apiId))
    : await fetchPlayerByName(player.searchName, {
        expectedSport: player.sport,
        expectedTeam: player.apiTeam || "",
      });

  if (apiPlayer?.imageCandidates?.length > 0) {
    return apiPlayer;
  }

  const fallbackImage = player.allowRepresentativeFallback
    ? await fetchFallbackPlayerImage(player)
    : "";

  if (!apiPlayer && !fallbackImage) {
    return null;
  }

  return {
    ...(apiPlayer || {}),
    image: apiPlayer?.image || fallbackImage,
    imageCandidates: getUniqueValues([
      ...(apiPlayer?.imageCandidates || []),
      fallbackImage,
    ]),
  };
};
