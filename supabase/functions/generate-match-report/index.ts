import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-report-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TeamRecord = {
  team_code: string;
  team_name: string | null;
  team_short_name: string | null;
  sport_id: string | null;
  league_id: string | null;
  league_name: string | null;
  season: number | null;
  rank: number | null;
  stats: Record<string, unknown> | null;
  updated_at: string | null;
};

type TeamStanding = {
  team_code: string;
  team_name: string | null;
  league_id: string | null;
  league_name: string | null;
  season: number | null;
  rank: number | null;
  games: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  points: number | null;
  win_rate: number | null;
  score_for: number | null;
  score_against: number | null;
  score_diff: number | null;
  games_behind: string | null;
  streak: string | null;
  recent: string | null;
  kda: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  updated_at: string | null;
};

const jsonResponse = (body: unknown, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
};

const getSupabaseSecretKey = () => {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (legacyKey) {
    return legacyKey;
  }

  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");

  if (!secretKeys) {
    return null;
  }

  try {
    const parsedKeys = JSON.parse(secretKeys) as Record<string, unknown>;

    if (typeof parsedKeys.default === "string") {
      return parsedKeys.default;
    }

    const availableKey = Object.values(parsedKeys).find(
      (value) => typeof value === "string",
    );

    return typeof availableKey === "string" ? availableKey : null;
  } catch {
    return null;
  }
};

const hasScore = (score: unknown) => {
  if (score === null || score === undefined || score === "") {
    return false;
  }

  if (typeof score === "number") {
    return true;
  }

  if (typeof score === "string") {
    return score.trim() !== "";
  }

  if (typeof score === "object") {
    return Object.keys(score as Record<string, unknown>).length > 0;
  }

  return false;
};

const normalizeLeagueName = (leagueName: unknown) => {
  return String(leagueName ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "");
};

const getLeagueMatchScore = (recordLeague: unknown, matchLeague: unknown) => {
  const normalizedRecordLeague = normalizeLeagueName(recordLeague);

  const normalizedMatchLeague = normalizeLeagueName(matchLeague);

  if (!normalizedRecordLeague || !normalizedMatchLeague) {
    return 0;
  }

  if (normalizedRecordLeague === normalizedMatchLeague) {
    return 3;
  }

  if (
    normalizedRecordLeague.includes(normalizedMatchLeague) ||
    normalizedMatchLeague.includes(normalizedRecordLeague)
  ) {
    return 2;
  }

  return 0;
};

const selectBestTeamRow = <
  T extends {
    team_code: string;
    league_name: string | null;
    season: number | null;
    updated_at: string | null;
  },
>(
  rows: T[],
  teamCode: string,
  matchLeague: string,
  matchSeason: number,
) => {
  const candidates = rows.filter((row) => row.team_code === teamCode);

  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((firstRow, secondRow) => {
    const firstLeagueScore = getLeagueMatchScore(
      firstRow.league_name,
      matchLeague,
    );

    const secondLeagueScore = getLeagueMatchScore(
      secondRow.league_name,
      matchLeague,
    );

    if (firstLeagueScore !== secondLeagueScore) {
      return secondLeagueScore - firstLeagueScore;
    }

    const firstSeasonScore = firstRow.season === matchSeason ? 1 : 0;

    const secondSeasonScore = secondRow.season === matchSeason ? 1 : 0;

    if (firstSeasonScore !== secondSeasonScore) {
      return secondSeasonScore - firstSeasonScore;
    }

    const firstSeason = firstRow.season ?? 0;

    const secondSeason = secondRow.season ?? 0;

    if (firstSeason !== secondSeason) {
      return secondSeason - firstSeason;
    }

    const firstUpdatedAt = new Date(firstRow.updated_at ?? 0).getTime();

    const secondUpdatedAt = new Date(secondRow.updated_at ?? 0).getTime();

    return secondUpdatedAt - firstUpdatedAt;
  })[0];
};

const createTeamContext = ({
  teamCode,
  matchLeague,
  matchSeason,
  records,
  standings,
}: {
  teamCode: string;
  matchLeague: string;
  matchSeason: number;
  records: TeamRecord[];
  standings: TeamStanding[];
}) => {
  const record = selectBestTeamRow(records, teamCode, matchLeague, matchSeason);

  const standing = selectBestTeamRow(
    standings,
    teamCode,
    matchLeague,
    matchSeason,
  );

  return {
    code: teamCode,

    name: record?.team_name ?? standing?.team_name ?? teamCode,

    shortName:
      record?.team_short_name ??
      record?.team_name ??
      standing?.team_name ??
      teamCode,

    seasonRecord: record
      ? {
          season: record.season,
          leagueId: record.league_id,
          leagueName: record.league_name,
          rank: record.rank,
          stats: record.stats,
          updatedAt: record.updated_at,
        }
      : null,

    standing: standing
      ? {
          season: standing.season,
          leagueId: standing.league_id,
          leagueName: standing.league_name,
          rank: standing.rank,
          games: standing.games,
          wins: standing.wins,
          draws: standing.draws,
          losses: standing.losses,
          points: standing.points,
          winRate: standing.win_rate,
          scoreFor: standing.score_for,
          scoreAgainst: standing.score_against,
          scoreDiff: standing.score_diff,
          gamesBehind: standing.games_behind,
          streak: standing.streak,
          recent: standing.recent,
          kda: standing.kda,
          kills: standing.kills,
          deaths: standing.deaths,
          assists: standing.assists,
          updatedAt: standing.updated_at,
        }
      : null,
  };
};

const parseScore = (score: unknown) => {
  if (typeof score === "number") {
    return {
      awayScore: score,
      homeScore: null,
    };
  }

  if (typeof score === "string") {
    const matchedScore = score.match(/(\d+)\s*[:\-]\s*(\d+)/);

    if (matchedScore) {
      return {
        awayScore: Number(matchedScore[1]),
        homeScore: Number(matchedScore[2]),
      };
    }
  }

  if (score && typeof score === "object") {
    const scoreObject = score as Record<string, unknown>;

    const awayScore =
      scoreObject.away ??
      scoreObject.away_score ??
      scoreObject.awayScore ??
      scoreObject.visitor ??
      scoreObject.left;

    const homeScore =
      scoreObject.home ??
      scoreObject.home_score ??
      scoreObject.homeScore ??
      scoreObject.host ??
      scoreObject.right;

    if (
      Number.isFinite(Number(awayScore)) &&
      Number.isFinite(Number(homeScore))
    ) {
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

const createResultContext = ({
  score,
  awayTeam,
  homeTeam,
}: {
  score: unknown;
  awayTeam: {
    code: string;
    name: string;
  };
  homeTeam: {
    code: string;
    name: string;
  };
}) => {
  const { awayScore, homeScore } = parseScore(score);

  if (awayScore === null || homeScore === null) {
    return {
      rawScore: score,
      awayScore,
      homeScore,
      resultType: "unknown",
      winnerCode: null,
      winnerName: null,
      loserCode: null,
      loserName: null,
      scoreDifference: null,
    };
  }

  if (awayScore === homeScore) {
    return {
      rawScore: score,
      awayScore,
      homeScore,
      resultType: "draw",
      winnerCode: null,
      winnerName: null,
      loserCode: null,
      loserName: null,
      scoreDifference: 0,
    };
  }

  const awayWon = awayScore > homeScore;

  return {
    rawScore: score,
    awayScore,
    homeScore,
    resultType: "win",
    winnerCode: awayWon ? awayTeam.code : homeTeam.code,
    winnerName: awayWon ? awayTeam.name : homeTeam.name,
    loserCode: awayWon ? homeTeam.code : awayTeam.code,
    loserName: awayWon ? homeTeam.name : awayTeam.name,
    scoreDifference: Math.abs(awayScore - homeScore),
  };
};

const createPredictionContext = ({
  predictions,
  awayTeam,
  homeTeam,
  winnerCode,
}: {
  predictions: {
    selected_team_code: string;
  }[];
  awayTeam: {
    code: string;
    name: string;
  };
  homeTeam: {
    code: string;
    name: string;
  };
  winnerCode: string | null;
}) => {
  const voteCounts = new Map<string, number>();

  predictions.forEach((prediction) => {
    const selectedTeamCode = prediction.selected_team_code;

    voteCounts.set(
      selectedTeamCode,
      (voteCounts.get(selectedTeamCode) ?? 0) + 1,
    );
  });

  const awayVotes = voteCounts.get(awayTeam.code) ?? 0;

  const homeVotes = voteCounts.get(homeTeam.code) ?? 0;

  const totalVotes = predictions.length;

  const toPercentage = (votes: number) => {
    if (totalVotes === 0) {
      return 0;
    }

    return Number(((votes / totalVotes) * 100).toFixed(1));
  };

  let leadingTeamCode: string | null = null;
  let leadingTeamName: string | null = null;

  if (awayVotes > homeVotes) {
    leadingTeamCode = awayTeam.code;
    leadingTeamName = awayTeam.name;
  }

  if (homeVotes > awayVotes) {
    leadingTeamCode = homeTeam.code;
    leadingTeamName = homeTeam.name;
  }

  let predictionResult:
    | "no_votes"
    | "tie"
    | "majority_correct"
    | "majority_incorrect"
    | "result_unknown" = "result_unknown";

  if (totalVotes === 0) {
    predictionResult = "no_votes";
  } else if (!leadingTeamCode) {
    predictionResult = "tie";
  } else if (!winnerCode) {
    predictionResult = "result_unknown";
  } else if (leadingTeamCode === winnerCode) {
    predictionResult = "majority_correct";
  } else {
    predictionResult = "majority_incorrect";
  }

  let sampleSize: "none" | "very_small" | "small" | "normal" = "normal";

  if (totalVotes === 0) {
    sampleSize = "none";
  } else if (totalVotes < 10) {
    sampleSize = "very_small";
  } else if (totalVotes < 30) {
    sampleSize = "small";
  }

  return {
    totalVotes,
    sampleSize,
    away: {
      teamCode: awayTeam.code,
      teamName: awayTeam.name,
      votes: awayVotes,
      percentage: toPercentage(awayVotes),
    },
    home: {
      teamCode: homeTeam.code,
      teamName: homeTeam.name,
      votes: homeVotes,
      percentage: toPercentage(homeVotes),
    },
    leadingTeamCode,
    leadingTeamName,
    predictionResult,
  };
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        message: "POST 요청만 사용할 수 있습니다.",
      },
      405,
    );
  }

  try {
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

    const reportFunctionSecret = Deno.env.get("REPORT_FUNCTION_SECRET");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    const supabaseSecretKey = getSupabaseSecretKey();

    if (!openAiApiKey) {
      throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
    }

    if (!reportFunctionSecret) {
      throw new Error("REPORT_FUNCTION_SECRET이 설정되지 않았습니다.");
    }

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error("Supabase 관리자 환경 변수가 설정되지 않았습니다.");
    }

    const requestSecret = request.headers.get("x-report-secret");

    if (requestSecret !== reportFunctionSecret) {
      return jsonResponse(
        {
          message: "AI 리포트 생성 권한이 없습니다.",
        },
        401,
      );
    }

    const requestBody = await request.json();

    const matchId = Number(requestBody?.matchId);

    const force = requestBody?.force === true;

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return jsonResponse(
        {
          message: "올바른 matchId가 필요합니다.",
        },
        400,
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: existingReport, error: existingReportError } =
      await supabaseAdmin
        .from("match_ai_reports")
        .select("*")
        .eq("match_id", matchId)
        .maybeSingle();

    if (existingReportError) {
      throw existingReportError;
    }

    if (existingReport && !force) {
      return jsonResponse({
        created: false,
        regenerated: false,
        report: existingReport,
      });
    }

    const { data: match, error: matchError } = await supabaseAdmin
      .from("matches")
      .select(
        `
        id,
        sport,
        league,
        match_date,
        match_time,
        away_team_code,
        home_team_code,
        score,
        status,
        venue
      `,
      )
      .eq("id", matchId)
      .single();

    if (matchError) {
      throw matchError;
    }

    if (!match) {
      return jsonResponse(
        {
          message: "경기 정보를 찾을 수 없습니다.",
        },
        404,
      );
    }

    if (match.status !== "finished") {
      return jsonResponse(
        {
          message: "아직 종료되지 않은 경기입니다.",
        },
        400,
      );
    }

    if (!hasScore(match.score)) {
      return jsonResponse(
        {
          message: "종료된 경기의 스코어 정보가 없습니다.",
        },
        400,
      );
    }

    const teamCodes = [match.away_team_code, match.home_team_code].filter(
      (teamCode): teamCode is string => Boolean(teamCode),
    );

    const [predictionResult, teamRecordResult, teamStandingResult] =
      await Promise.all([
        supabaseAdmin
          .from("predictions")
          .select("selected_team_code")
          .eq("match_id", matchId),

        supabaseAdmin
          .from("team_records")
          .select(
            `
          team_code,
          team_name,
          team_short_name,
          sport_id,
          league_id,
          league_name,
          season,
          rank,
          stats,
          updated_at
        `,
          )
          .in("team_code", teamCodes)
          .eq("sport_id", match.sport)
          .order("season", {
            ascending: false,
          })
          .order("updated_at", {
            ascending: false,
          }),

        supabaseAdmin
          .from("team_standings")
          .select(
            `
          team_code,
          team_name,
          league_id,
          league_name,
          season,
          rank,
          games,
          wins,
          draws,
          losses,
          points,
          win_rate,
          score_for,
          score_against,
          score_diff,
          games_behind,
          streak,
          recent,
          kda,
          kills,
          deaths,
          assists,
          updated_at
        `,
          )
          .in("team_code", teamCodes)
          .order("season", {
            ascending: false,
          })
          .order("updated_at", {
            ascending: false,
          }),
      ]);

    if (predictionResult.error) {
      throw predictionResult.error;
    }

    if (teamRecordResult.error) {
      throw teamRecordResult.error;
    }

    if (teamStandingResult.error) {
      throw teamStandingResult.error;
    }

    const matchSeason = Number(String(match.match_date).slice(0, 4));

    const records = (teamRecordResult.data ?? []) as TeamRecord[];

    const standings = (teamStandingResult.data ?? []) as TeamStanding[];

    const awayTeam = createTeamContext({
      teamCode: match.away_team_code,
      matchLeague: match.league,
      matchSeason,
      records,
      standings,
    });

    const homeTeam = createTeamContext({
      teamCode: match.home_team_code,
      matchLeague: match.league,
      matchSeason,
      records,
      standings,
    });

    const resultContext = createResultContext({
      score: match.score,
      awayTeam,
      homeTeam,
    });

    const fanPrediction = createPredictionContext({
      predictions: predictionResult.data ?? [],
      awayTeam,
      homeTeam,
      winnerCode: resultContext.winnerCode,
    });

    const openai = new OpenAI({
      apiKey: openAiApiKey,
    });

    const model = "gpt-5-mini";

    const aiResponse = await openai.responses.create({
      model,
      store: false,

      instructions: `
너는 한국 스포츠 팬을 위한 FanPick의 전문 경기 분석 작성자다.

반드시 입력 JSON에 제공된 데이터만 사용해 한국어로 작성한다.

핵심 원칙:
- 팀 코드는 내부 식별자이므로 출력하지 말고 teamName을 사용한다.
- 제공되지 않은 선수 활약, 전술, 점유율, 슈팅 수, 부상, 교체, 경기 흐름, 득점 시간은 절대 추측하지 않는다.
- 순위와 시즌 기록은 경기 당시 기록이 아니라 데이터 갱신 시점의 현재 스냅샷일 수 있다. 따라서 "경기 전 순위"라고 단정하지 않는다.
- 기록 데이터가 없는 항목은 억지로 언급하지 않는다.
- recentForm이나 lastFive가 제공되면 기록된 문자열 범위에서만 최근 흐름을 설명한다.
- 순위 숫자가 작을수록 더 높은 순위다.
- 단순히 최종 점수를 반복하는 요약이 아니라 시즌 성적, 순위, 최근 흐름, 팬 예측을 비교해 결과의 의미를 설명한다.
- 객관적 근거 없이 "이변", "완벽한 경기 운영", "압도적인 경기력" 같은 표현을 사용하지 않는다.
- 낮은 순위 팀이 높은 순위 팀을 이겼거나 팬 예측 우세 팀이 패한 경우에만 근거를 명시해 예상 밖 결과라고 표현할 수 있다.

팬 예측 작성 규칙:
- totalVotes가 0이면 팬 예측을 언급하지 않는다.
- totalVotes가 10표 미만이면 반드시 "참여 N표 기준"이라고 명시한다.
- 표본이 매우 적을 때 "팬들은", "대다수 팬", "전반적인 예상"처럼 전체 팬 의견으로 일반화하지 않는다.
- 양 팀 득표가 같으면 예측 우세 팀이 있었다고 표현하지 않는다.
- 득표수와 퍼센트는 입력 데이터에 있는 값만 사용한다.

종목별 분석 기준:
- soccer: 순위, 승·무·패, 승점, 득실 차, 최근 흐름을 우선한다.
- baseball: 순위, 승·패, 승률, 게임 차, 연승·연패, 득점 차를 우선한다.
- esports: 순위, 승·패, 매치 또는 세트 스코어, KDA, 킬·데스·어시스트, 최근 흐름을 우선한다.

출력 기준:
- title: 실제 팀명을 사용한 짧고 명확한 경기 결과 제목
- summary: 3~4문장으로 경기 결과와 시즌 기록 비교, 팬 예측 결과를 자연스럽게 연결한 분석
- key_points: 서로 중복되지 않는 구체적인 핵심 포인트 정확히 3개
- key_points 중 하나는 기록 비교, 하나는 최종 결과의 의미, 하나는 팬 예측 또는 최근 흐름을 다룬다
- 팬 예측이나 최근 흐름 데이터가 없으면 다른 확인 가능한 기록으로 대체한다
        `.trim(),

      input: JSON.stringify({
        match: {
          sport: match.sport,
          league: match.league,
          matchDate: match.match_date,
          matchTime: match.match_time,
          venue: match.venue,
          status: match.status,
        },

        scoreOrder: "awayScore : homeScore",

        result: resultContext,

        awayTeam,

        homeTeam,

        fanPrediction,

        dataLimitations: {
          detailedPlayerStats: false,
          tacticalData: false,
          eventTimeline: false,
          recordsMayBeCurrentSnapshot: true,
        },
      }),

      text: {
        format: {
          type: "json_schema",
          name: "fanpick_match_report",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: {
                type: "string",
              },
              summary: {
                type: "string",
              },
              key_points: {
                type: "array",
                items: {
                  type: "string",
                },
                minItems: 3,
                maxItems: 3,
              },
            },
            required: ["title", "summary", "key_points"],
            additionalProperties: false,
          },
        },
      },
    });

    if (!aiResponse.output_text) {
      throw new Error("AI가 리포트를 생성하지 못했습니다.");
    }

    const generatedReport = JSON.parse(aiResponse.output_text);

    const { data: savedReport, error: saveError } = await supabaseAdmin
      .from("match_ai_reports")
      .upsert(
        {
          match_id: match.id,
          title: generatedReport.title,
          summary: generatedReport.summary,
          key_points: generatedReport.key_points,
          model,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "match_id",
        },
      )
      .select()
      .single();

    if (saveError) {
      throw saveError;
    }

    return jsonResponse({
      created: !existingReport,
      regenerated: Boolean(existingReport),
      context: {
        awayTeam: awayTeam.name,
        homeTeam: homeTeam.name,
        totalPredictionVotes: fanPrediction.totalVotes,
      },
      report: savedReport,
    });
  } catch (error) {
    console.error("AI 경기 리포트 생성 실패:", error);

    return jsonResponse(
      {
        message:
          error instanceof Error
            ? error.message
            : "AI 경기 리포트 생성 중 오류가 발생했습니다.",
      },
      500,
    );
  }
});
