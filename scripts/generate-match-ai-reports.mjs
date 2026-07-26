import { createClient } from "@supabase/supabase-js";

const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const KOREA_TIME_OFFSET = 9 * 60 * 60 * 1000;

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_SERVER_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const reportFunctionSecret = process.env.REPORT_FUNCTION_SECRET;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL 또는 VITE_SUPABASE_URL이 설정되지 않았습니다.");
}

if (!supabaseKey) {
  throw new Error("Supabase 키가 설정되지 않았습니다.");
}

if (!reportFunctionSecret) {
  throw new Error("REPORT_FUNCTION_SECRET이 설정되지 않았습니다.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const getKoreaDate = (daysAgo = 0) => {
  const targetDate = new Date(
    Date.now() + KOREA_TIME_OFFSET - daysAgo * ONE_DAY_IN_MILLISECONDS,
  );

  const year = targetDate.getUTCFullYear();
  const month = String(targetDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const generateReport = async (matchId) => {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/generate-match-report`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-report-secret": reportFunctionSecret,
      },
      body: JSON.stringify({
        matchId,
      }),
    },
  );

  const responseText = await response.text();

  let result;

  try {
    result = responseText ? JSON.parse(responseText) : {};
  } catch {
    result = {
      message: responseText,
    };
  }

  if (!response.ok) {
    throw new Error(result.message ?? `리포트 생성 실패: ${response.status}`);
  }

  return result;
};

const generateMatchAiReports = async () => {
  const today = getKoreaDate(0);
  const yesterday = getKoreaDate(1);

  console.log(`\n[FanPick AI] ${yesterday} ~ ${today} 종료 경기 조회 중...\n`);

  const { data: finishedMatches, error: matchError } = await supabase
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
      status
    `,
    )
    .in("match_date", [yesterday, today])
    .eq("status", "finished")
    .order("match_date", {
      ascending: true,
    })
    .order("match_time", {
      ascending: true,
    });

  if (matchError) {
    throw matchError;
  }

  if (!finishedMatches?.length) {
    console.log("[FanPick AI] 어제와 오늘 종료된 경기가 없습니다.");

    return;
  }

  const matchIds = finishedMatches.map((match) => match.id);

  const { data: existingReports, error: reportError } = await supabase
    .from("match_ai_reports")
    .select("match_id")
    .in("match_id", matchIds);

  if (reportError) {
    throw reportError;
  }

  const reportedMatchIds = new Set(
    (existingReports ?? []).map((report) => report.match_id),
  );

  const matchesToGenerate = finishedMatches.filter(
    (match) => !reportedMatchIds.has(match.id),
  );

  console.log(`[FanPick AI] 종료 경기: ${finishedMatches.length}경기`);
  console.log(`[FanPick AI] 기존 리포트: ${reportedMatchIds.size}경기`);
  console.log(`[FanPick AI] 생성 대상: ${matchesToGenerate.length}경기\n`);

  if (matchesToGenerate.length === 0) {
    console.log("[FanPick AI] 모든 종료 경기의 리포트가 이미 생성되었습니다.");

    return;
  }

  let successCount = 0;
  let skippedCount = 0;
  let failureCount = 0;

  for (const match of matchesToGenerate) {
    const matchName = `${match.away_team_code} vs ${match.home_team_code}`;

    const matchLabel = `${match.match_date} ${matchName}`;

    try {
      console.log(`[생성 중] ${matchLabel}`);

      const result = await generateReport(match.id);

      if (result.created) {
        successCount += 1;

        console.log(`[생성 완료] ${matchLabel}`);
      } else {
        skippedCount += 1;

        console.log(`[이미 존재] ${matchLabel}`);
      }
    } catch (error) {
      failureCount += 1;

      console.error(
        `[생성 실패] ${matchLabel}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log("\n[FanPick AI] 리포트 생성 작업 완료");
  console.log(`신규 생성: ${successCount}`);
  console.log(`이미 존재: ${skippedCount}`);
  console.log(`실패: ${failureCount}`);

  if (failureCount > 0) {
    process.exitCode = 1;
  }
};

generateMatchAiReports().catch((error) => {
  console.error(
    "\n[FanPick AI] 실행 실패:",
    error instanceof Error ? error.message : error,
  );

  process.exitCode = 1;
});
