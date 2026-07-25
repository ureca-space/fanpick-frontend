import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button.jsx";
import EmptyState from "../../components/EmptyState/EmptyState.jsx";
import PaginationControls from "../../components/PaginationControls/PaginationControls.jsx";
import Skeleton from "../../components/Skeleton/Skeleton.jsx";
import { getTeamInfo } from "../../constants/teamInfo.js";
import {
  FAVORITE_TEAMS_CHANGED_EVENT,
  fetchFavoriteTeamIds,
  getFavoriteTeamIds,
} from "../../services/favoriteTeams.js";
import {
  createSettledPredictionSummary,
  fetchMatchPredictionStats,
  fetchMyPredictions,
  hasResolvedPredictionScore,
  resolvePredictionResult,
} from "../../services/predictionApi.js";
import { supabase } from "../../lib/supabase.js";
import { getPredictionBadgeMeta } from "../../utils/predictionBadge.js";
import {
  canChangePredictionByBeginAt,
  createMatchBeginAt,
} from "../../utils/predictionDeadline.js";
import { createPredictionPath } from "../../utils/predictionPath.js";
import { getTeamsByIds, TEAM_LEAGUE_LABELS } from "../Teams/data/teams.js";
import { RESULT_LABELS } from "../Prediction/predictionUtils.js";
import styles from "./MyPage.module.css";

const INITIAL_USER_INFO = {
  id: "",
  nickname: "",
  email: "",
  joinedAt: "",
  avatarUrl: "",
};

const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const FAVORITE_TEAMS_PAGE_SIZE = 6;
const PICK_HISTORY_PAGE_SIZE = 4;
const PREDICTION_SPORTS = ["soccer", "baseball", "esports"];
const SPORT_LABELS = {
  baseball: "BASEBALL",
  esports: "LOL",
  soccer: "SOCCER",
};
const EMPTY_PREDICTION_SUMMARY = {
  total: 0,
  correct: 0,
  incorrect: 0,
  accuracy: 0,
};

const MyPageSkeleton = () => (
  <main className={styles.myPage}>
    <div
      className={`container ${styles.inner}`}
      aria-label="마이페이지 로딩 중"
    >
      <header className={styles.pageHeader}>
        <Skeleton.Line className={styles.skeletonEyebrow} />
        <Skeleton.Line className={styles.skeletonPageTitle} />
        <Skeleton.Line className={styles.skeletonPageDescription} />
      </header>

      <section className={styles.profileSection}>
        <div className={styles.profileMain}>
          <Skeleton.Circle className={styles.skeletonProfileAvatar} />

          <div className={styles.profileInfo}>
            <Skeleton.Line className={styles.skeletonNickname} />
            <Skeleton.Line className={styles.skeletonEmail} />
            <Skeleton.Line className={styles.skeletonJoinedAt} />
          </div>
        </div>

        <div className={styles.profileBadges}>
          {PREDICTION_SPORTS.map((sport) => (
            <article
              key={sport}
              className={`${styles.profileBadge} ${styles.skeletonStaticCard}`}
            >
              <Skeleton.Circle className={styles.skeletonBadgeIcon} />

              <div className={styles.skeletonBadgeInfo}>
                <Skeleton.Line className={styles.skeletonBadgeSport} />
                <Skeleton.Line className={styles.skeletonBadgeTitle} />
                <Skeleton.Line className={styles.skeletonBadgeText} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.statisticsSection}>
        <div className={styles.sectionHeader}>
          <Skeleton.Line className={styles.skeletonSectionTitle} />
          <Skeleton.Line className={styles.skeletonSectionDescription} />
        </div>

        <div className={styles.statisticsGrid}>
          {Array.from({ length: 4 }, (_, index) => (
            <article
              key={index}
              className={`${styles.statisticCard} ${styles.skeletonStaticCard}`}
            >
              <Skeleton.Line className={styles.skeletonStatLabel} />
              <Skeleton.Line className={styles.skeletonStatValue} />
            </article>
          ))}
        </div>
      </section>

      <section className={styles.favoriteTeamsSection}>
        <div className={styles.sectionHeaderWithNavigation}>
          <div className={styles.sectionHeader}>
            <Skeleton.Line className={styles.skeletonSectionTitle} />
            <Skeleton.Line className={styles.skeletonSectionDescription} />
          </div>

          <div className={styles.skeletonSectionNavigation}>
            <Skeleton.Line className={styles.skeletonPageCount} />
            <Skeleton.Circle className={styles.skeletonNavigationButton} />
            <Skeleton.Circle className={styles.skeletonNavigationButton} />
          </div>
        </div>

        <div className={styles.favoriteTeamsGrid}>
          {Array.from({ length: FAVORITE_TEAMS_PAGE_SIZE }, (_, index) => (
            <article
              key={index}
              className={`${styles.favoriteTeamCard} ${styles.skeletonStaticCard}`}
            >
              <Skeleton.Box className={styles.skeletonFavoriteLogoBox} />

              <div className={styles.favoriteTeamInfo}>
                <Skeleton.Line className={styles.skeletonFavoriteLeague} />
                <Skeleton.Line className={styles.skeletonFavoriteName} />
                <Skeleton.Line className={styles.skeletonFavoriteTone} />
                <Skeleton.Line className={styles.skeletonFavoriteToneShort} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.historySection}>
        <div className={styles.sectionHeaderWithNavigation}>
          <div className={styles.sectionHeader}>
            <Skeleton.Line className={styles.skeletonSectionTitle} />
            <Skeleton.Line className={styles.skeletonSectionDescription} />
          </div>

          <div className={styles.skeletonSectionNavigation}>
            <Skeleton.Line className={styles.skeletonPageCount} />
            <Skeleton.Circle className={styles.skeletonNavigationButton} />
            <Skeleton.Circle className={styles.skeletonNavigationButton} />
          </div>
        </div>

        <div className={styles.historyList}>
          {Array.from({ length: PICK_HISTORY_PAGE_SIZE }, (_, index) => (
            <article
              key={index}
              className={`${styles.historyCard} ${styles.skeletonStaticCard}`}
            >
              <div className={styles.historyMeta}>
                <Skeleton.Line className={styles.skeletonHistoryMeta} />
                <Skeleton.Line className={styles.skeletonHistoryResult} />
              </div>

              <div className={styles.historyDate}>
                <Skeleton.Line className={styles.skeletonHistoryDate} />
                <Skeleton.Line className={styles.skeletonHistoryTime} />
              </div>

              <div className={styles.historyTeams}>
                <Skeleton.Line className={styles.skeletonHistoryTeam} />
                <Skeleton.Line className={styles.skeletonHistoryScore} />
                <Skeleton.Line className={styles.skeletonHistoryTeam} />
              </div>

              <div className={styles.historyPrediction}>
                <div className={styles.historyPredictionLabels}>
                  <Skeleton.Line className={styles.skeletonPredictionLabel} />
                  <Skeleton.Line className={styles.skeletonPredictionLabel} />
                </div>

                <Skeleton.Line className={styles.skeletonPredictionBar} />
              </div>

              <div className={styles.historyFooter}>
                <Skeleton.Line className={styles.skeletonHistoryPick} />
                <Skeleton.Line className={styles.skeletonHistoryButton} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  </main>
);

const formatJoinedDate = (date) => {
  if (!date) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
};

const normalizeTeamCode = (teamCode) => teamCode?.trim().toUpperCase() || "";

const parseScore = (score) => {
  if (!score) {
    return {
      awayScore: null,
      homeScore: null,
    };
  }

  const [awayScore, homeScore] = score.split(":").map(Number);

  return {
    awayScore: Number.isFinite(awayScore) ? awayScore : null,
    homeScore: Number.isFinite(homeScore) ? homeScore : null,
  };
};

const formatMatchDate = (dateKey) => {
  if (!dateKey) {
    return "날짜 미정";
  }

  const [, month, day] = dateKey.split("-");

  return `${month}.${day}`;
};

const createFallbackSportSummaries = (predictions) =>
  Object.fromEntries(
    PREDICTION_SPORTS.map((sport) => {
      const sportPredictions = predictions.filter(
        (prediction) => prediction.matches?.sport === sport,
      );

      return [sport, createSettledPredictionSummary(sportPredictions)];
    }),
  );

const createSportStatistics = (predictions) => {
  const fallbackSummaries = createFallbackSportSummaries(predictions);

  return PREDICTION_SPORTS.map((sport) => {
    const fallbackStats = fallbackSummaries[sport] ?? EMPTY_PREDICTION_SUMMARY;

    return {
      sport,
      total: fallbackStats.total,
      correct: fallbackStats.correct,
      accuracy: fallbackStats.accuracy,
    };
  });
};

const getPredictionRates = (predictionStats, matchId) => {
  const matchStats = predictionStats.find(
    (stat) => String(stat.match_id) === String(matchId),
  );

  return {
    awayRate: Number(matchStats?.away_rate ?? 50),
    homeRate: Number(matchStats?.home_rate ?? 50),
    participants: Number(matchStats?.participant_count ?? 0),
  };
};

const normalizePredictionHistory = (
  predictions,
  predictionStats,
  currentTime,
) =>
  predictions
    .map((prediction) => {
      const match = prediction.matches;

      if (!match) {
        return null;
      }

      const sport = match.sport;
      const homeTeamCode = normalizeTeamCode(match.home_team_code);
      const awayTeamCode = normalizeTeamCode(match.away_team_code);
      const selectedTeamCode = normalizeTeamCode(prediction.selected_team_code);
      const selectedSide =
        selectedTeamCode === homeTeamCode
          ? "home"
          : selectedTeamCode === awayTeamCode
            ? "away"
            : "";
      const homeTeam = getTeamInfo(homeTeamCode, sport);
      const awayTeam = getTeamInfo(awayTeamCode, sport);
      const selectedTeam =
        selectedSide === "home"
          ? homeTeam
          : selectedSide === "away"
            ? awayTeam
            : getTeamInfo(selectedTeamCode, sport);
      const { awayScore, homeScore } = parseScore(match.score);
      const resolvedResult = resolvePredictionResult(prediction);
      const hasScore =
        (["live", "finished"].includes(match.status) ||
          hasResolvedPredictionScore(match)) &&
        homeScore !== null &&
        awayScore !== null;
      const matchTime = match.match_time?.slice(0, 5) ?? "미정";
      const beginAt = createMatchBeginAt(match.match_date, matchTime);
      const rates = getPredictionRates(predictionStats, prediction.match_id);

      return {
        id: `${prediction.match_id}-${selectedTeamCode}`,
        matchId: prediction.match_id,
        dateLabel: formatMatchDate(match.match_date),
        time: matchTime,
        sportLabel: SPORT_LABELS[sport] ?? sport?.toUpperCase() ?? "",
        league: match.league ?? "",
        result: resolvedResult,
        resultLabel: RESULT_LABELS[resolvedResult] ?? "예측진행중",
        selectedSide,
        selectedTeam,
        homeTeam,
        awayTeam,
        beginAt,
        canChange:
          match.status === "scheduled" &&
          canChangePredictionByBeginAt(beginAt, currentTime),
        ...rates,
        scoreText: hasScore ? `${homeScore} : ${awayScore}` : "VS",
        status: match.status,
      };
    })
    .filter(Boolean);

const FavoriteTeamLogo = ({ team }) => {
  const [hasError, setHasError] = useState(false);

  if (!team.logo || hasError) {
    return (
      <div className={styles.favoriteTeamLogoFallback} aria-hidden="true">
        {team.shortName}
      </div>
    );
  }

  return (
    <img
      className={styles.favoriteTeamLogo}
      src={team.logo}
      alt={`${team.name} 로고`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

const MyPage = () => {
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState(INITIAL_USER_INFO);
  const [favoriteTeamIds, setFavoriteTeamIds] = useState([]);
  const [predictionRecords, setPredictionRecords] = useState([]);
  const [matchPredictionStats, setMatchPredictionStats] = useState([]);
  const [predictionError, setPredictionError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [favoriteTeamsPage, setFavoriteTeamsPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30_000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const getUserInfo = async () => {
      try {
        setLoadError("");

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        if (!user) {
          navigate("/login", {
            replace: true,
          });

          return;
        }

        const nextUserInfo = {
          id: user.id,
          nickname: user.user_metadata?.nickname || "FanPick 사용자",
          email: user.email || "",
          joinedAt: formatJoinedDate(user.created_at),
          avatarUrl: user.user_metadata?.avatar_url || "",
        };
        let nextPredictionError = "";

        const [nextFavoriteTeamIds, nextPredictionRecords, nextPredictionStats] =
          await Promise.all([
            fetchFavoriteTeamIds(user.id),
            fetchMyPredictions(user.id).catch((error) => {
              console.error("예측 기록 조회 오류:", error);
              nextPredictionError = "승부예측 정보를 불러오지 못했습니다.";
              return [];
            }),
            fetchMatchPredictionStats().catch((error) => {
              console.error("예측률 조회 오류:", error);
              return [];
            }),
          ]);

        if (!isMounted) {
          return;
        }

        setUserInfo(nextUserInfo);
        setFavoriteTeamIds(nextFavoriteTeamIds);
        setPredictionRecords(nextPredictionRecords);
        setMatchPredictionStats(nextPredictionStats);
        setPredictionError(nextPredictionError);
      } catch (error) {
        console.error("회원 정보 조회 오류:", error);

        if (isMounted) {
          setLoadError("회원 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getUserInfo();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!userInfo.id) {
      return undefined;
    }

    let isMounted = true;

    const syncFavoriteTeams = async (event) => {
      if (event.detail?.userId && event.detail.userId !== userInfo.id) {
        return;
      }

      if (Array.isArray(event.detail?.teamIds)) {
        if (isMounted) {
          setFavoriteTeamIds(event.detail.teamIds);
        }

        return;
      }

      if (event.type === "storage") {
        if (isMounted) {
          setFavoriteTeamIds(getFavoriteTeamIds(userInfo.id));
        }

        return;
      }

      const teamIds = await fetchFavoriteTeamIds(userInfo.id);

      if (isMounted) {
        setFavoriteTeamIds(teamIds);
      }
    };

    const refreshFavoriteTeams = async () => {
      const teamIds = await fetchFavoriteTeamIds(userInfo.id);

      if (isMounted) {
        setFavoriteTeamIds(teamIds);
      }
    };

    window.addEventListener(FAVORITE_TEAMS_CHANGED_EVENT, syncFavoriteTeams);
    window.addEventListener("storage", syncFavoriteTeams);
    window.addEventListener("focus", refreshFavoriteTeams);

    return () => {
      isMounted = false;
      window.removeEventListener(
        FAVORITE_TEAMS_CHANGED_EVENT,
        syncFavoriteTeams,
      );
      window.removeEventListener("storage", syncFavoriteTeams);
      window.removeEventListener("focus", refreshFavoriteTeams);
    };
  }, [userInfo.id]);

  const handleNicknameEditStart = () => {
    setNicknameInput(userInfo.nickname);
    setIsEditingNickname(true);
  };

  const handleNicknameEditCancel = () => {
    setNicknameInput(userInfo.nickname);
    setIsEditingNickname(false);
  };

  const handleNicknameSave = async () => {
    const trimmedNickname = nicknameInput.trim();

    if (!trimmedNickname) {
      alert("닉네임을 입력해 주세요.");
      return;
    }

    if (trimmedNickname.length > 12) {
      alert("닉네임은 12자 이하로 입력해 주세요.");
      return;
    }

    if (trimmedNickname === userInfo.nickname) {
      setIsEditingNickname(false);
      return;
    }

    try {
      setIsSavingNickname(true);

      const { error } = await supabase.auth.updateUser({
        data: {
          nickname: trimmedNickname,
        },
      });

      if (error) {
        throw error;
      }

      // 커뮤니티에서도 최신 닉네임을 표시하도록 공개 프로필을 함께 수정
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: userInfo.id,
            nickname: trimmedNickname,
            avatar_url: userInfo.avatarUrl || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (profileError) {
        throw profileError;
      }

      setUserInfo((prev) => ({
        ...prev,
        nickname: trimmedNickname,
      }));

      setNicknameInput(trimmedNickname);
      setIsEditingNickname(false);
    } catch (error) {
      console.error("닉네임 수정 오류:", error);
      alert("닉네임을 수정하지 못했습니다.");
    } finally {
      setIsSavingNickname(false);
    }
  };

  const handleNicknameKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleNicknameSave();
    }

    if (event.key === "Escape") {
      handleNicknameEditCancel();
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const extension = ALLOWED_IMAGE_TYPES[file.type];

    if (!extension) {
      alert("JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      alert("프로필 이미지는 2MB 이하만 업로드할 수 있습니다.");
      return;
    }

    try {
      setIsUploadingAvatar(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        navigate("/login", {
          replace: true,
        });

        return;
      }

      const filePath = `${user.id}/avatar.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          nickname: userInfo.nickname,
          avatar_url: avatarUrl,
        },
      });

      if (updateError) {
        throw updateError;
      }

      // 커뮤니티에서도 최신 프로필 사진을 표시하도록 공개 프로필을 함께 수정
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            nickname: userInfo.nickname,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (profileError) {
        throw profileError;
      }

      setUserInfo((prev) => ({
        ...prev,
        avatarUrl,
      }));
    } catch (error) {
      console.error("프로필 이미지 업로드 오류:", error);
      alert("프로필 이미지를 변경하지 못했습니다.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (isLoading) {
    return <MyPageSkeleton />;
  }

  if (loadError) {
    return (
      <main className={styles.myPage}>
        <div className="container">
          <EmptyState
            title={loadError}
            description="로그인 상태와 Supabase 연결 상태를 확인해 주세요."
          />
        </div>
      </main>
    );
  }

  const profileInitial =
    userInfo.nickname.trim().charAt(0).toUpperCase() || "F";

  const predictionSummary = createSettledPredictionSummary(predictionRecords);
  const sportStatistics = createSportStatistics(predictionRecords);

  const predictionStats = [
    {
      id: "total",
      label: "SETTLED PICKS",
      value: predictionSummary.total,
      unit: "회",
    },
    {
      id: "correct",
      label: "CORRECT",
      value: predictionSummary.correct,
      unit: "회",
    },
    {
      id: "incorrect",
      label: "INCORRECT",
      value: predictionSummary.incorrect,
      unit: "회",
    },
    {
      id: "accuracy",
      label: "ACCURACY",
      value: predictionSummary.accuracy,
      unit: "%",
    },
  ];

  const favoriteTeams = getTeamsByIds(favoriteTeamIds);
  const favoriteTeamsPageCount = Math.ceil(
    favoriteTeams.length / FAVORITE_TEAMS_PAGE_SIZE,
  );
  const safeFavoriteTeamsPage =
    favoriteTeamsPageCount === 0
      ? 0
      : Math.min(favoriteTeamsPage, favoriteTeamsPageCount - 1);
  const visibleFavoriteTeams = favoriteTeams.slice(
    safeFavoriteTeamsPage * FAVORITE_TEAMS_PAGE_SIZE,
    (safeFavoriteTeamsPage + 1) * FAVORITE_TEAMS_PAGE_SIZE,
  );
  const predictionHistory = normalizePredictionHistory(
    predictionRecords,
    matchPredictionStats,
    currentTime,
  );
  const historyPageCount = Math.ceil(
    predictionHistory.length / PICK_HISTORY_PAGE_SIZE,
  );
  const safeHistoryPage =
    historyPageCount === 0 ? 0 : Math.min(historyPage, historyPageCount - 1);
  const visiblePredictionHistory = predictionHistory.slice(
    safeHistoryPage * PICK_HISTORY_PAGE_SIZE,
    (safeHistoryPage + 1) * PICK_HISTORY_PAGE_SIZE,
  );

  const handlePreviousFavoriteTeamsPage = () => {
    setFavoriteTeamsPage(Math.max(safeFavoriteTeamsPage - 1, 0));
  };

  const handleNextFavoriteTeamsPage = () => {
    setFavoriteTeamsPage(
      Math.min(safeFavoriteTeamsPage + 1, favoriteTeamsPageCount - 1),
    );
  };

  const handlePreviousHistoryPage = () => {
    setHistoryPage(Math.max(safeHistoryPage - 1, 0));
  };

  const handleNextHistoryPage = () => {
    setHistoryPage(Math.min(safeHistoryPage + 1, historyPageCount - 1));
  };

  return (
    <main className={styles.myPage}>
      <div className={`container ${styles.inner}`}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>FANPICK ACCOUNT</p>

          <h1 className={styles.pageTitle}>MY PAGE</h1>

          <p className={styles.pageDescription}>
            내 정보와 승부예측 기록을 확인해 보세요.
          </p>
        </header>

        <section className={styles.profileSection}>
          <div className={styles.profileMain}>
            <div className={styles.avatarArea}>
              <label
                htmlFor="profile-avatar-input"
                className={`${styles.profileAvatar} ${
                  isUploadingAvatar ? styles.profileAvatarUploading : ""
                }`}
                aria-label="프로필 사진 변경"
              >
                {userInfo.avatarUrl ? (
                  <img
                    src={userInfo.avatarUrl}
                    alt={`${userInfo.nickname} 프로필`}
                    className={styles.profileAvatarImage}
                  />
                ) : (
                  <span aria-hidden="true">{profileInitial}</span>
                )}

                <span className={styles.profileAvatarOverlay}>
                  {isUploadingAvatar ? "업로드 중" : "사진 변경"}
                </span>
              </label>

              <input
                id="profile-avatar-input"
                type="file"
                className={styles.profileAvatarInput}
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
              />
            </div>

            <div className={styles.profileInfo}>
              {isEditingNickname ? (
                <div className={styles.nicknameEdit}>
                  <input
                    type="text"
                    className={styles.nicknameInput}
                    value={nicknameInput}
                    onChange={(event) => setNicknameInput(event.target.value)}
                    onKeyDown={handleNicknameKeyDown}
                    maxLength={12}
                    autoFocus
                    aria-label="닉네임"
                  />

                  <div className={styles.editActions}>
                    <button
                      type="button"
                      className={styles.saveButton}
                      onClick={handleNicknameSave}
                      disabled={isSavingNickname}
                    >
                      {isSavingNickname ? "저장 중..." : "저장"}
                    </button>

                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={handleNicknameEditCancel}
                      disabled={isSavingNickname}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.nicknameRow}>
                  <strong className={styles.nickname}>
                    {userInfo.nickname}
                  </strong>

                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={handleNicknameEditStart}
                  >
                    수정
                  </button>
                </div>
              )}

              <span className={styles.email}>{userInfo.email}</span>

              <span className={styles.joinedAt}>
                가입일 {userInfo.joinedAt}
              </span>
            </div>
          </div>

          <div className={styles.profileBadges}>
            {sportStatistics.map((statistic) => {
              const badgeMeta = getPredictionBadgeMeta(
                statistic.sport,
                statistic.total,
                statistic.accuracy,
              );
              const SportIcon = badgeMeta.SportIcon;
              const TierIcon = badgeMeta.TierIcon;

              return (
                <article
                  key={statistic.sport}
                  className={styles.profileBadge}
                  aria-label={`${badgeMeta.sportName} ${badgeMeta.tierLabel} 배지 ${badgeMeta.name}`}
                >
                  <span
                    className={styles.profileBadgeIcon}
                    data-tier={badgeMeta.tier}
                    aria-hidden="true"
                  >
                    <SportIcon />
                    <span className={styles.profileBadgeTierIcon}>
                      <TierIcon />
                    </span>
                  </span>

                  <div>
                    <span className={styles.profileBadgeSport}>
                      {badgeMeta.sportLabel}
                    </span>

                    <strong className={styles.profileBadgeTitle}>
                      {badgeMeta.name}
                    </strong>

                    <span className={styles.profileBadgeAccuracy}>
                      예측 {statistic.total}회 · 적중률 {statistic.accuracy}%
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className={styles.statisticsSection}
          aria-labelledby="prediction-statistics-title"
        >
          <div className={styles.sectionHeader}>
            <h2
              id="prediction-statistics-title"
              className={styles.sectionTitle}
            >
              PICK STATISTICS
            </h2>

            <p className={styles.sectionDescription}>
              지금까지 참여한 승부예측 결과입니다.
            </p>
          </div>

          <div className={styles.statisticsGrid}>
            {predictionStats.map((stat) => (
              <article key={stat.id} className={styles.statisticCard}>
                <span className={styles.statisticLabel}>{stat.label}</span>

                <strong className={styles.statisticValue}>
                  {stat.value}

                  <span className={styles.statisticUnit}>{stat.unit}</span>
                </strong>
              </article>
            ))}
          </div>
        </section>

        <section
          className={styles.favoriteTeamsSection}
          aria-labelledby="favorite-teams-title"
        >
          <div className={styles.sectionHeaderWithNavigation}>
            <div className={styles.sectionHeader}>
              <h2 id="favorite-teams-title" className={styles.sectionTitle}>
                FAVORITE TEAMS
              </h2>

              <p className={styles.sectionDescription}>
                Teams 페이지에서 관심을 누른 팀들이 여기에 모입니다.
              </p>
            </div>

            {favoriteTeamsPageCount > 1 && (
              <PaginationControls
                ariaLabel="관심 팀 페이지 이동"
                className={styles.sectionNavigation}
                currentPage={safeFavoriteTeamsPage}
                nextLabel="다음 관심 팀 보기"
                onNext={handleNextFavoriteTeamsPage}
                onPrevious={handlePreviousFavoriteTeamsPage}
                previousLabel="이전 관심 팀 보기"
                totalPages={favoriteTeamsPageCount}
              />
            )}
          </div>

          {favoriteTeams.length > 0 ? (
            <div className={styles.favoriteTeamsGrid}>
              {visibleFavoriteTeams.map((team) => (
                <Link
                  key={team.id}
                  className={styles.favoriteTeamCard}
                  to={`/teams/${team.id}`}
                >
                  <div className={styles.favoriteTeamLogoBox}>
                    <FavoriteTeamLogo team={team} />
                  </div>

                  <div className={styles.favoriteTeamInfo}>
                    <span className={styles.favoriteTeamLeague}>
                      {TEAM_LEAGUE_LABELS[team.league]} · {team.home}
                    </span>

                    <strong className={styles.favoriteTeamName}>
                      {team.name}
                    </strong>

                    <p className={styles.favoriteTeamTone}>{team.tone}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="아직 저장한 관심 팀이 없습니다."
              description="KBO, K리그, LCK 팀을 둘러보고 마음이 가는 팀을 저장해 보세요."
              action={
                <Button size="lg" to="/teams">
                  관심 팀 찾기
                </Button>
              }
            />
          )}
        </section>

        <section
          className={styles.historySection}
          aria-labelledby="prediction-history-title"
        >
          <div className={styles.sectionHeaderWithNavigation}>
            <div className={styles.sectionHeader}>
              <h2 id="prediction-history-title" className={styles.sectionTitle}>
                PICK HISTORY
              </h2>

              <p className={styles.sectionDescription}>
                참여한 승부예측을 확인할 수 있습니다.
              </p>
            </div>

            {historyPageCount > 1 && (
              <PaginationControls
                ariaLabel="승부예측 기록 페이지 이동"
                className={styles.sectionNavigation}
                currentPage={safeHistoryPage}
                nextLabel="다음 승부예측 기록 보기"
                onNext={handleNextHistoryPage}
                onPrevious={handlePreviousHistoryPage}
                previousLabel="이전 승부예측 기록 보기"
                totalPages={historyPageCount}
              />
            )}
          </div>

          {predictionError ? (
            <EmptyState
              title={predictionError}
              description="잠시 후 다시 시도해 주세요."
            />
          ) : predictionHistory.length > 0 ? (
            <div className={styles.historyList}>
              {visiblePredictionHistory.map((prediction) => (
                <article
                  key={prediction.id}
                  className={styles.historyCard}
                >
                  <div className={styles.historyMeta}>
                    <span>
                      {prediction.sportLabel} · {prediction.league}
                    </span>

                    <strong
                      className={styles.historyResult}
                      data-result={prediction.result}
                    >
                      {prediction.resultLabel}
                    </strong>
                  </div>

                  <div className={styles.historyDate}>
                    <strong>{prediction.dateLabel}</strong>
                    <span>{prediction.time}</span>
                  </div>

                  <div className={styles.historyTeams}>
                    <span
                      className={`${styles.historyTeam} ${
                        prediction.selectedSide === "home"
                          ? styles.historyPick
                          : ""
                      }`}
                    >
                      {prediction.homeTeam.name}
                    </span>

                    <strong className={styles.historyScore}>
                      {prediction.scoreText}
                    </strong>

                    <span
                      className={`${styles.historyTeam} ${
                        prediction.selectedSide === "away"
                          ? styles.historyPick
                          : ""
                      }`}
                    >
                      {prediction.awayTeam.name}
                    </span>
                  </div>

                  <div className={styles.historyPrediction}>
                    <div className={styles.historyPredictionLabels}>
                      <span>
                        {prediction.homeTeam.name}
                        <strong>{prediction.homeRate}%</strong>
                      </span>

                      <span>
                        <strong>{prediction.awayRate}%</strong>
                        {prediction.awayTeam.name}
                      </span>
                    </div>

                    <div className={styles.historyPredictionBar}>
                      <span
                        className={styles.historyHomePredictionBar}
                        style={{ width: `${prediction.homeRate}%` }}
                      />

                      <span
                        className={styles.historyAwayPredictionBar}
                        style={{ width: `${prediction.awayRate}%` }}
                      />
                    </div>
                  </div>

                  <div className={styles.historyFooter}>
                    <p className={styles.historySelectedTeam}>
                      내 선택 {prediction.selectedTeam.name} ·{" "}
                      {prediction.participants.toLocaleString()}명 참여
                    </p>

                    <Button
                      className={styles.historyChangeButton}
                      disabled={!prediction.canChange}
                      size="sm"
                      to={createPredictionPath({ matchId: prediction.matchId })}
                      variant="outline"
                    >
                      {prediction.canChange ? "투표 변경" : "변경 마감"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="아직 참여한 승부예측이 없습니다."
              description="경기의 승리 팀을 선택하고 첫 번째 예측에 참여해 보세요."
              action={
                <Button size="lg" to="/prediction">
                  승부예측 참여하기
                </Button>
              }
            />
          )}
        </section>
      </div>
    </main>
  );
};

export default MyPage;
