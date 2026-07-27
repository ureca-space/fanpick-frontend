import { createClient } from "@supabase/supabase-js";

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
  throw new Error(
    "SUPABASE_SERVER_KEY 또는 Supabase Publishable Key가 설정되지 않았습니다.",
  );
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

const wait = (milliseconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

const regenerateReport = async (matchId) => {
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
        force: true,
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
    throw new Error(result.message ?? `HTTP ${response.status} 오류`);
  }

  return result;
};

const regenerateAllReports = async () => {
  console.log("\n[FanPick AI] 기존 AI 리포트 조회 중...\n");

  const { data: existingReports, error: reportError } = await supabase
    .from("match_ai_reports")
    .select("match_id")
    .order("match_id", {
      ascending: true,
    });

  if (reportError) {
    throw reportError;
  }

  const matchIds = [
    ...new Set((existingReports ?? []).map((report) => report.match_id)),
  ];

  if (matchIds.length === 0) {
    console.log("[FanPick AI] 재생성할 기존 리포트가 없습니다.");

    return;
  }

  console.log(`[FanPick AI] 재생성 대상: ${matchIds.length}경기\n`);

  let successCount = 0;
  let failureCount = 0;

  for (let index = 0; index < matchIds.length; index += 1) {
    const matchId = matchIds[index];

    try {
      console.log(
        `[${index + 1}/${matchIds.length}] matchId ${matchId} 재생성 중...`,
      );

      const result = await regenerateReport(matchId);

      successCount += 1;

      console.log(`[재생성 완료] matchId ${matchId}`);

      console.log(`  ${result.report?.title ?? "제목 없음"}\n`);
    } catch (error) {
      failureCount += 1;

      console.error(
        `[재생성 실패] matchId ${matchId}:`,
        error instanceof Error ? error.message : error,
      );

      console.log("");
    }

    // OpenAI API를 너무 빠르게 연속 호출하지 않도록 대기
    await wait(1000);
  }

  console.log("\n[FanPick AI] 전체 리포트 교체 완료");

  console.log(`재생성 성공: ${successCount}`);

  console.log(`재생성 실패: ${failureCount}`);

  if (failureCount > 0) {
    process.exitCode = 1;
  }
};

regenerateAllReports().catch((error) => {
  console.error(
    "\n[FanPick AI] 전체 재생성 작업 실패:",
    error instanceof Error ? error.message : error,
  );

  process.exitCode = 1;
});
