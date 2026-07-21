import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FAVORITE_TEAMS_CHANGED_EVENT,
  fetchFavoriteTeamIds,
  getFavoriteTeamIds,
} from "../../services/favoriteTeams.js";
import { supabase } from "../../lib/supabase.js";
import { getTeamsByIds, TEAM_LEAGUE_LABELS } from "../Teams/data/teams.js";
import styles from "./MyPage.module.css";

const INITIAL_USER_INFO = {
  id: "",
  nickname: "",
  email: "",
  joinedAt: "",
  avatarUrl: "",
};

const SPORT_BADGE_INFO = {
  soccer: {
    label: "SOCCER",
    koreanName: "축구",
    icon: "⚽",
  },
  baseball: {
    label: "BASEBALL",
    koreanName: "야구",
    icon: "⚾",
  },
  esports: {
    label: "LOL",
    koreanName: "롤",
    icon: "🎮",
  },
};

const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const formatJoinedDate = (date) => {
  if (!date) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
};

const getBadgeTitle = (sport, total, accuracy) => {
  const sportName = SPORT_BADGE_INFO[sport].koreanName;

  if (total < 5) {
    return `${sportName} 입문자`;
  }

  if (accuracy >= 80) {
    if (sport === "esports") {
      return "롤도사";
    }

    return `${sportName}의 신`;
  }

  if (accuracy >= 60) {
    return `${sportName}잘알`;
  }

  if (accuracy >= 40) {
    return `평범한 ${sportName}팬`;
  }

  if (accuracy >= 20) {
    return `${sportName}알못`;
  }

  if (sport === "soccer") {
    return "축구 반대로 가는 자";
  }

  if (sport === "baseball") {
    return "역배 장인";
  }

  return "브론즈 예언가";
};

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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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
        const nextFavoriteTeamIds = await fetchFavoriteTeamIds(user.id);

        if (!isMounted) {
          return;
        }

        setUserInfo(nextUserInfo);
        setFavoriteTeamIds(nextFavoriteTeamIds);
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
    return (
      <main className={styles.myPage}>
        <div className="container">
          <p className={styles.stateMessage}>회원 정보를 불러오는 중입니다.</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className={styles.myPage}>
        <div className="container">
          <p className={styles.stateMessage}>{loadError}</p>
        </div>
      </main>
    );
  }

  const profileInitial =
    userInfo.nickname.trim().charAt(0).toUpperCase() || "F";

  const predictionSummary = {
    total: 0,
    correct: 0,
    incorrect: 0,
    accuracy: 0,
  };

  const sportStatistics = [
    {
      sport: "soccer",
      total: 0,
      correct: 0,
      accuracy: 0,
    },
    {
      sport: "baseball",
      total: 0,
      correct: 0,
      accuracy: 0,
    },
    {
      sport: "esports",
      total: 0,
      correct: 0,
      accuracy: 0,
    },
  ];

  const predictionStats = [
    {
      id: "total",
      label: "TOTAL PICKS",
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

  return (
    <main className={styles.myPage}>
      <div className={`container ${styles.inner}`}>
        <header className={styles.pageHeader}>
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
              const sportInfo = SPORT_BADGE_INFO[statistic.sport];

              const badgeTitle = getBadgeTitle(
                statistic.sport,
                statistic.total,
                statistic.accuracy,
              );

              return (
                <article
                  key={statistic.sport}
                  className={styles.profileBadge}
                  aria-label={`${sportInfo.koreanName} 배지 ${badgeTitle}`}
                >
                  <span className={styles.profileBadgeIcon} aria-hidden="true">
                    {sportInfo.icon}
                  </span>

                  <div>
                    <span className={styles.profileBadgeSport}>
                      {sportInfo.label}
                    </span>

                    <strong className={styles.profileBadgeTitle}>
                      {badgeTitle}
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
          className={styles.favoriteTeamsSection}
          aria-labelledby="favorite-teams-title"
        >
          <div className={styles.sectionHeader}>
            <h2 id="favorite-teams-title" className={styles.sectionTitle}>
              FAVORITE TEAMS
            </h2>

            <p className={styles.sectionDescription}>
              Teams 페이지에서 관심을 누른 팀들이 여기에 모입니다.
            </p>
          </div>

          {favoriteTeams.length > 0 ? (
            <div className={styles.favoriteTeamsGrid}>
              {favoriteTeams.map((team) => (
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
            <div className={styles.emptyFavoriteTeams}>
              <strong className={styles.emptyTitle}>
                아직 저장한 관심 팀이 없습니다.
              </strong>

              <p className={styles.emptyDescription}>
                KBO, K리그, LCK 팀을 둘러보고 마음이 가는 팀을 저장해 보세요.
              </p>

              <button
                type="button"
                className={styles.moveButton}
                onClick={() => navigate("/teams")}
              >
                관심 팀 찾기
              </button>
            </div>
          )}
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
          className={styles.historySection}
          aria-labelledby="prediction-history-title"
        >
          <div className={styles.sectionHeader}>
            <h2 id="prediction-history-title" className={styles.sectionTitle}>
              PICK HISTORY
            </h2>

            <p className={styles.sectionDescription}>
              최근 참여한 승부예측을 확인할 수 있습니다.
            </p>
          </div>

          <div className={styles.emptyHistory}>
            <strong className={styles.emptyTitle}>
              아직 참여한 승부예측이 없습니다.
            </strong>

            <p className={styles.emptyDescription}>
              경기의 승리 팀을 선택하고 첫 번째 예측에 참여해 보세요.
            </p>

            <button
              type="button"
              className={styles.moveButton}
              onClick={() => navigate("/prediction")}
            >
              승부예측 참여하기
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default MyPage;
