import { isLiveMatchStatus } from "../../utils/matchStatus";
import styles from "./PredictionResultInsight.module.css";

const normalizeTeamCode = (teamCode) => teamCode?.trim().toUpperCase() ?? "";

const parseScore = (score) => {
  if (!score) {
    return {
      awayScore: null,
      homeScore: null,
    };
  }

  const [awayScore, homeScore] = String(score).split(":").map(Number);

  return {
    awayScore: Number.isFinite(awayScore) ? awayScore : null,
    homeScore: Number.isFinite(homeScore) ? homeScore : null,
  };
};

const getTeamName = (team) => team?.name ?? team?.shortName ?? "-";

const getMatchTeamCode = (match, side) => {
  if (side === "home") {
    return normalizeTeamCode(
      match.homeTeamCode ?? match.home_team_code ?? match.homeTeam?.code,
    );
  }

  return normalizeTeamCode(
    match.awayTeamCode ?? match.away_team_code ?? match.awayTeam?.code,
  );
};

const getWinnerSide = (match) => {
  if (match?.status === "cancelled" || match?.status === "postponed") {
    return match.status;
  }

  if (isLiveMatchStatus(match?.status)) {
    return "live";
  }

  const { awayScore, homeScore } = parseScore(match.score);

  if (awayScore === null || homeScore === null) {
    return "";
  }

  if (homeScore === awayScore) {
    return "draw";
  }

  return homeScore > awayScore ? "home" : "away";
};

const getPredictionRates = (match) => {
  const homeRate = Number(match.homeVotes ?? 50);
  const awayRate = Number(match.awayVotes ?? 50);

  if (!Number.isFinite(homeRate) || !Number.isFinite(awayRate)) {
    return {
      homeRate: 50,
      awayRate: 50,
    };
  }

  return {
    homeRate,
    awayRate,
  };
};

const getMyPredictionResult = (match, winnerSide) => {
  const selectedTeamCode = normalizeTeamCode(match.myPrediction?.selectedTeamCode);

  if (!selectedTeamCode) {
    return null;
  }

  if (
    winnerSide === "cancelled" ||
    winnerSide === "postponed" ||
    winnerSide === "live"
  ) {
    return winnerSide;
  }

  if (!winnerSide) {
    return "pending";
  }

  if (winnerSide === "draw") {
    return "void";
  }

  const selectedSide =
    selectedTeamCode === getMatchTeamCode(match, "home")
      ? "home"
      : selectedTeamCode === getMatchTeamCode(match, "away")
        ? "away"
        : "";

  return selectedSide === winnerSide ? "correct" : "incorrect";
};

const RESULT_LABELS = {
  correct: "예측 성공",
  incorrect: "예측 실패",
  pending: "정산 대기",
  live: "경기중",
  cancelled: "경기 취소",
  postponed: "경기 연기",
  void: "무승부 무효",
};

const PredictionResultInsight = ({ className = "", match }) => {
  const winnerSide = getWinnerSide(match);
  const { homeRate, awayRate } = getPredictionRates(match);
  const majoritySide =
    homeRate === awayRate ? "draw" : homeRate > awayRate ? "home" : "away";
  const myPredictionResult = getMyPredictionResult(match, winnerSide);
  const selectedTeamCode = normalizeTeamCode(match.myPrediction?.selectedTeamCode);
  const selectedTeam =
    selectedTeamCode === getMatchTeamCode(match, "home")
      ? match.homeTeam
      : selectedTeamCode === getMatchTeamCode(match, "away")
        ? match.awayTeam
        : null;
  const winnerTeam =
    winnerSide === "home"
      ? match.homeTeam
      : winnerSide === "away"
        ? match.awayTeam
        : null;
  const majorityTeam =
    majoritySide === "home"
      ? match.homeTeam
      : majoritySide === "away"
        ? match.awayTeam
        : null;

  return (
    <div className={`${styles.insight} ${className}`.trim()}>
      {selectedTeam && myPredictionResult && (
        <div
          className={`${styles.item} ${styles.myPick}`}
          data-result={myPredictionResult}
        >
          <span>내 예측</span>
          <strong>{getTeamName(selectedTeam)}</strong>
          <b>{RESULT_LABELS[myPredictionResult]}</b>
        </div>
      )}

      <div className={styles.item}>
        <span>실제 승자</span>
        <strong>
          {winnerSide === "cancelled"
            ? "경기취소"
            : winnerSide === "postponed"
              ? "경기연기"
              : winnerSide === "live"
                ? "경기중"
              : winnerSide === "draw"
                ? "무승부"
                : getTeamName(winnerTeam)}
        </strong>
        <b>
          {winnerSide === "cancelled"
            ? "취소"
            : winnerSide === "postponed"
              ? "연기"
              : winnerSide === "live"
                ? "진행"
              : winnerSide === "draw"
                ? "무효"
                : "승리"}
        </b>
      </div>

      <div className={styles.item}>
        <span>팬픽 우세</span>
        <strong>
          {majoritySide === "draw" ? "예측 동률" : getTeamName(majorityTeam)}
        </strong>
        <b>
          {majoritySide === "draw"
            ? "50%"
            : `${majoritySide === "home" ? homeRate : awayRate}%`}
        </b>
      </div>
    </div>
  );
};

export default PredictionResultInsight;
