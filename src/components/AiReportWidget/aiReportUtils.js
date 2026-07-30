export const FILTERS = [
  { id: "all", label: "ALL" },
  { id: "baseball", label: "BASEBALL" },
  { id: "soccer", label: "SOCCER" },
  { id: "esports", label: "LOL" },
];

export const SPORT_LABELS = {
  baseball: "BASEBALL",
  soccer: "SOCCER",
  esports: "LOL",
};

export const getTeamName = (match, side, useShortName = false) => {
  if (!match) return "";

  const teamCode = match[`${side}_team_code`];

  const fullName = match[`${side}_team_name`] ?? teamCode;

  const shortName = match[`${side}_team_short_name`] ?? fullName;

  return useShortName ? shortName : fullName;
};

export const replaceTeamCodes = (text, match) => {
  if (!text || !match) {
    return text ?? "";
  }

  let convertedText = String(text);

  const teams = [
    {
      code: match.away_team_code,
      name: getTeamName(match, "away"),
    },
    {
      code: match.home_team_code,
      name: getTeamName(match, "home"),
    },
  ];

  teams.forEach(({ code, name }) => {
    if (!code || !name) return;

    convertedText = convertedText.replaceAll(code, name);
  });

  return convertedText;
};

export const formatMatchDate = (date) => {
  if (!date) return "";

  const [, month, day] = date.split("-");

  return `${month}.${day}`;
};

export const formatMatchTime = (time) => {
  if (!time) return "";

  return String(time).slice(0, 5);
};

const parseScore = (score) => {
  if (score === null || score === undefined || score === "") {
    return {
      awayScore: null,
      homeScore: null,
    };
  }

  if (typeof score === "string") {
    const matchedScore = score.match(/(\d+)\s*[:-]\s*(\d+)/);

    if (matchedScore) {
      return {
        awayScore: Number(matchedScore[1]),
        homeScore: Number(matchedScore[2]),
      };
    }
  }

  if (typeof score === "object") {
    const awayScore =
      score.away ??
      score.away_score ??
      score.awayScore ??
      score.visitor ??
      score.left;

    const homeScore =
      score.home ??
      score.home_score ??
      score.homeScore ??
      score.host ??
      score.right;

    if (awayScore !== undefined && homeScore !== undefined) {
      return {
        awayScore: Number(awayScore),
        homeScore: Number(homeScore),
      };
    }
  }

  return {
    awayScore: null,
    homeScore: null,
  };
};

export const formatScore = (score) => {
  if (score === null || score === undefined || score === "") {
    return "VS";
  }

  if (typeof score === "number") {
    return String(score);
  }

  if (typeof score === "string") {
    return score.trim() || "VS";
  }

  const { awayScore, homeScore } = parseScore(score);

  if (awayScore !== null && homeScore !== null) {
    return `${awayScore}:${homeScore}`;
  }

  return "VS";
};

export const getResultLabel = (match) => {
  if (!match) return "경기 종료";

  const { awayScore, homeScore } = parseScore(match.score);

  if (awayScore === null || homeScore === null) {
    return "경기 종료";
  }

  if (awayScore === homeScore) {
    return "무승부";
  }

  if (awayScore > homeScore) {
    return `${getTeamName(match, "away", true)} 승리`;
  }

  return `${getTeamName(match, "home", true)} 승리`;
};

export const getMatchTitle = (match) => {
  if (!match) {
    return "경기 분석";
  }

  return `${getTeamName(match, "away", true)} vs ${getTeamName(match, "home", true)}`;
};

export const getMatchDescription = (match) => {
  if (!match) {
    return "AI 분석 결과";
  }

  return [
    SPORT_LABELS[match.sport] ?? match.sport,
    match.league,
    formatMatchDate(match.match_date),
    formatMatchTime(match.match_time),
  ]
    .filter(Boolean)
    .join(" · ");
};

export const sortReports = (reportList) => {
  return [...reportList].sort((firstReport, secondReport) => {
    const firstDate = firstReport.match?.match_date ?? "";

    const secondDate = secondReport.match?.match_date ?? "";

    const dateComparison = secondDate.localeCompare(firstDate);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    const firstTime = firstReport.match?.match_time ?? "";

    const secondTime = secondReport.match?.match_time ?? "";

    return secondTime.localeCompare(firstTime);
  });
};
