import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiBarChart2,
  FiList,
  FiMessageCircle,
  FiSend,
  FiX,
} from "react-icons/fi";
import { fetchMatchAiReports } from "../../services/matchAiReportService.js";
import styles from "./AiReportWidget.module.css";

const FILTERS = [
  { id: "all", label: "ALL" },
  { id: "baseball", label: "BASEBALL" },
  { id: "soccer", label: "SOCCER" },
  { id: "esports", label: "LOL" },
];

const SPORT_LABELS = {
  baseball: "BASEBALL",
  soccer: "SOCCER",
  esports: "LOL",
};

const TYPEWRITER_SPEED_MS = 18;
const NEXT_MESSAGE_DELAY_MS = 300;

const getTeamName = (match, side, useShortName = false) => {
  if (!match) return "";

  const teamCode = match[`${side}_team_code`];

  const fullName = match[`${side}_team_name`] ?? teamCode;

  const shortName = match[`${side}_team_short_name`] ?? fullName;

  return useShortName ? shortName : fullName;
};

const replaceTeamCodes = (text, match) => {
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

const formatMatchDate = (date) => {
  if (!date) return "";

  const [, month, day] = date.split("-");

  return `${month}.${day}`;
};

const formatMatchTime = (time) => {
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

const formatScore = (score) => {
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

const getResultLabel = (match) => {
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

const getMatchTitle = (match) => {
  if (!match) {
    return "경기 분석";
  }

  return `${getTeamName(match, "away", true)} vs ${getTeamName(match, "home", true)}`;
};

const getMatchDescription = (match) => {
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

const sortReports = (reportList) => {
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

const AnalysisEmptyState = ({ onStart }) => (
  <div className={styles.analysisEmptyState}>
    <FiMessageCircle className={styles.emptyChatIcon} aria-hidden="true" />

    <strong>분석 대화를 시작해보세요</strong>

    <p>경기 결과에서 원하는 경기를 선택하면 AI 분석이 대화처럼 쌓입니다.</p>

    <button
      type="button"
      className={styles.emptyActionButton}
      onClick={onStart}
    >
      경기 결과 보기
      <FiSend aria-hidden="true" />
    </button>
  </div>
);

const AnalysisHistory = ({ reports, onOpen, onStart }) => (
  <div className={styles.analysisHome}>
    <header className={styles.analysisHomeHeader}>
      <div>
        <span className={styles.reportLabel}>CONVERSATION</span>
        <h3>분석 대화</h3>
      </div>

      <button
        type="button"
        className={styles.newAnalysisButton}
        onClick={onStart}
      >
        새 분석
        <FiSend aria-hidden="true" />
      </button>
    </header>

    <div className={styles.historyList}>
      {reports.map((report) => {
        const match = report.match;

        return (
          <button
            type="button"
            className={styles.historyCard}
            key={report.id}
            onClick={() => onOpen(report.id)}
          >
            <span className={styles.historyMeta}>
              {getMatchDescription(match)}
            </span>

            <strong>{getMatchTitle(match)}</strong>

            <p>{replaceTeamCodes(report.title, match)}</p>
          </button>
        );
      })}
    </div>
  </div>
);

const AnimatedBotMessage = ({ label, text, onComplete }) => {
  const safeText = String(text ?? "");
  const [visibleLength, setVisibleLength] = useState(0);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (!safeText) {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete?.();
      }

      return undefined;
    }

    if (visibleLength >= safeText.length) {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete?.();
      }

      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setVisibleLength((previousLength) => previousLength + 1);
    }, TYPEWRITER_SPEED_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onComplete, safeText, visibleLength]);

  const isTyping = visibleLength < safeText.length;

  return (
    <div className={styles.botMessage}>
      <span className={styles.messageAvatar} aria-hidden="true">
        <img src="/fanpick_mascot.svg" alt="" />
      </span>

      <div className={`${styles.messageBubble} ${styles.aiTextBubble}`}>
        {label && <span className={styles.messageLabel}>{label}</span>}

        <p className={styles.typedText}>
          {safeText.slice(0, visibleLength)}
          {isTyping && <span className={styles.typingCursor} />}
        </p>
      </div>
    </div>
  );
};

const AnalysisConversation = ({ isRevealed, onBack, onReveal, report }) => {
  const match = report.match;
  const keyPoints = useMemo(
    () => (Array.isArray(report.key_points) ? report.key_points : []),
    [report.key_points],
  );
  const nextMessageTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const analysisMessages = useMemo(() => {
    const messages = [
      {
        id: "title",
        label: "AI REPORT",
        text: replaceTeamCodes(report.title, match),
      },
      {
        id: "summary",
        label: "경기 요약",
        text: replaceTeamCodes(report.summary, match),
      },
      ...keyPoints.map((point, index) => ({
        id: `point-${index}`,
        label: `포인트 ${index + 1}`,
        text: replaceTeamCodes(point, match),
      })),
    ];

    return messages.filter((message) => message.text.trim());
  }, [keyPoints, match, report.summary, report.title]);
  const [visibleMessageCount, setVisibleMessageCount] = useState(() =>
    isRevealed && analysisMessages.length > 0 ? 1 : 0,
  );

  useEffect(() => {
    return () => {
      window.clearTimeout(nextMessageTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isRevealed) return;

    messagesEndRef.current?.scrollIntoView({
      block: "end",
      behavior: "smooth",
    });
  }, [isRevealed, visibleMessageCount]);

  const handleMessageComplete = () => {
    window.clearTimeout(nextMessageTimeoutRef.current);

    nextMessageTimeoutRef.current = window.setTimeout(() => {
      setVisibleMessageCount((previousCount) =>
        Math.min(previousCount + 1, analysisMessages.length),
      );
    }, NEXT_MESSAGE_DELAY_MS);
  };

  const handleRevealClick = () => {
    setVisibleMessageCount(analysisMessages.length > 0 ? 1 : 0);
    onReveal();
  };

  return (
    <div className={styles.chatView}>
      <header className={styles.chatHeader}>
        <button
          type="button"
          className={styles.chatBackButton}
          onClick={onBack}
          aria-label="분석 대화 목록으로 돌아가기"
        >
          <FiArrowLeft aria-hidden="true" />
        </button>

        <div className={styles.chatTitleWrap}>
          <strong>{getMatchTitle(match)}</strong>
          <span>AI 분석 결과를 대화형으로 확인해보세요</span>
        </div>
      </header>

      <div className={styles.chatMessages}>
        <div className={styles.botMessage}>
          <span className={styles.messageAvatar} aria-hidden="true">
            <img src="/fanpick_mascot.svg" alt="" />
          </span>

          <div className={styles.messageBubble}>
            <p>
              안녕하세요. FanPick AI입니다.
              <br />
              {getMatchTitle(match)} 경기 분석을 준비했습니다.
            </p>
          </div>
        </div>

        {!isRevealed && (
          <div className={styles.promptAction}>
            <button
              type="button"
              className={styles.revealAnalysisButton}
              onClick={handleRevealClick}
            >
              분석 결과 보여줘
              <FiSend aria-hidden="true" />
            </button>
          </div>
        )}

        {isRevealed && (
          <>
            <div className={styles.userMessage}>
              <div className={`${styles.messageBubble} ${styles.userBubble}`}>
                분석 결과 보여줘
              </div>
            </div>

            {analysisMessages
              .slice(0, visibleMessageCount)
              .map((message, index) => (
                <AnimatedBotMessage
                  key={`${report.id}-${message.id}`}
                  label={message.label}
                  text={message.text}
                  onComplete={
                    index === visibleMessageCount - 1
                      ? handleMessageComplete
                      : undefined
                  }
                />
              ))}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

const AiReportWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSport, setActiveSport] = useState("all");

  const [activeView, setActiveView] = useState("results");
  const [selectedReportId, setSelectedReportId] = useState("");
  const [analysisReportIds, setAnalysisReportIds] = useState([]);
  const [revealedReportIds, setRevealedReportIds] = useState([]);

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return undefined;

    let isCancelled = false;

    const loadReports = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await fetchMatchAiReports();

        if (!isCancelled) {
          setReports(data);
        }
      } catch (error) {
        console.error("AI 리포트 조회 실패:", error);

        if (!isCancelled) {
          setErrorMessage("경기 분석 리포트를 불러오지 못했습니다.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  const filteredReports = useMemo(() => {
    if (activeSport !== "all") {
      const reportsBySport = reports.filter(
        (report) => report.match?.sport === activeSport,
      );

      const latestMatchDate = reportsBySport.reduce((latestDate, report) => {
        const matchDate = report.match?.match_date;

        if (!matchDate) {
          return latestDate;
        }

        if (!latestDate || matchDate > latestDate) {
          return matchDate;
        }

        return latestDate;
      }, "");

      if (!latestMatchDate) {
        return [];
      }

      return sortReports(
        reportsBySport.filter(
          (report) => report.match?.match_date === latestMatchDate,
        ),
      );
    }

    const latestDateBySport = reports.reduce((latestDates, report) => {
      const sport = report.match?.sport;

      const matchDate = report.match?.match_date;

      if (!sport || !matchDate) {
        return latestDates;
      }

      if (!latestDates[sport] || matchDate > latestDates[sport]) {
        latestDates[sport] = matchDate;
      }

      return latestDates;
    }, {});

    return sortReports(
      reports.filter((report) => {
        const sport = report.match?.sport;

        const matchDate = report.match?.match_date;

        if (!sport || !matchDate) {
          return false;
        }

        return latestDateBySport[sport] === matchDate;
      }),
    );
  }, [activeSport, reports]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId),
    [reports, selectedReportId],
  );

  const analysisReports = useMemo(
    () =>
      analysisReportIds
        .map((reportId) => reports.find((report) => report.id === reportId))
        .filter(Boolean),
    [analysisReportIds, reports],
  );

  const handleTogglePanel = () => {
    setIsOpen((previousState) => !previousState);
  };

  const handleClosePanel = () => {
    setIsOpen(false);
  };

  const handleShowResults = () => {
    setSelectedReportId("");
    setActiveView("results");
  };

  const handleShowAnalysisHome = () => {
    setSelectedReportId("");
    setActiveView("analysis");
  };

  const handleOpenAnalysis = (reportId) => {
    setAnalysisReportIds((previousReportIds) => [
      reportId,
      ...previousReportIds.filter(
        (previousReportId) => previousReportId !== reportId,
      ),
    ]);
    setSelectedReportId(reportId);
    setActiveView("analysis");
  };

  const handleRevealAnalysis = (reportId) => {
    setRevealedReportIds((previousReportIds) => [
      reportId,
      ...previousReportIds.filter(
        (previousReportId) => previousReportId !== reportId,
      ),
    ]);
  };

  const hasReports = filteredReports.length > 0;

  const panelTitle =
    activeView === "results"
      ? "최근 경기 결과"
      : selectedReport
        ? "AI 분석 대화"
        : "분석 대화";

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className={styles.backdrop}
          onClick={handleClosePanel}
          aria-label="경기 리포트 닫기"
        />
      )}

      <section
        className={`${styles.panel} ${isOpen ? styles.open : ""}`}
        aria-hidden={!isOpen}
        aria-label={panelTitle}
      >
        <header className={styles.panelHeader}>
          <div className={styles.headerText}>
            <span className={styles.eyebrow}>FANPICK AI</span>

            <h2 className={styles.title}>{panelTitle}</h2>
          </div>
        </header>

        {activeView === "results" && (
          <div className={styles.filterArea}>
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`${styles.filterButton} ${
                  activeSport === filter.id ? styles.selectedFilter : ""
                }`}
                onClick={() => setActiveSport(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        <div className={styles.panelContent}>
          {isLoading && (
            <div className={styles.statusMessage}>
              경기 정보를 불러오는 중입니다.
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className={styles.errorMessage}>{errorMessage}</div>
          )}

          {!isLoading &&
            !errorMessage &&
            activeView === "results" &&
            !hasReports && (
            <div className={styles.emptyState}>
              <div className={styles.logoBox}>
                <img src="/fanpick_mascot.svg" alt="" />
              </div>

              <strong>등록된 경기 정보가 없습니다</strong>

              <p>
                해당 종목의 경기가 종료된 후
                <br />
                경기 결과와 AI 분석이 제공됩니다.
              </p>
            </div>
          )}

          {!isLoading &&
            !errorMessage &&
            hasReports &&
            activeView === "results" && (
              <div className={styles.reportList}>
                {filteredReports.map((report) => {
                  const match = report.match;

                  if (!match) {
                    return null;
                  }

                  return (
                    <article key={report.id} className={styles.resultCard}>
                      <div className={styles.matchMeta}>
                        <span className={styles.sportLabel}>
                          {SPORT_LABELS[match.sport] ?? match.sport}
                        </span>

                        {match.league && <span>{match.league}</span>}

                        <span>{formatMatchDate(match.match_date)}</span>

                        {match.match_time && (
                          <span>{formatMatchTime(match.match_time)}</span>
                        )}
                      </div>

                      <div className={styles.matchup}>
                        <span
                          className={styles.teamCode}
                          title={getTeamName(match, "away")}
                        >
                          {getTeamName(match, "away", true)}
                        </span>

                        <strong className={styles.score}>
                          {formatScore(match.score)}
                        </strong>

                        <span
                          className={styles.teamCode}
                          title={getTeamName(match, "home")}
                        >
                          {getTeamName(match, "home", true)}
                        </span>
                      </div>

                      <div className={styles.resultFooter}>
                        <strong className={styles.resultStatus}>
                          {getResultLabel(match)}
                        </strong>

                        {match.venue && (
                          <span className={styles.venue}>{match.venue}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        className={styles.analysisButton}
                        onClick={() => handleOpenAnalysis(report.id)}
                      >
                        분석 결과 보러가기
                        <FiSend aria-hidden="true" />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}

          {!isLoading &&
            !errorMessage &&
            activeView === "analysis" &&
            selectedReport && (
              <AnalysisConversation
                key={selectedReport.id}
                isRevealed={revealedReportIds.includes(selectedReport.id)}
                onReveal={() => handleRevealAnalysis(selectedReport.id)}
                report={selectedReport}
                onBack={handleShowAnalysisHome}
              />
            )}

          {!isLoading &&
            !errorMessage &&
            activeView === "analysis" &&
            !selectedReport &&
            analysisReports.length === 0 && (
              <AnalysisEmptyState onStart={handleShowResults} />
            )}

          {!isLoading &&
            !errorMessage &&
            activeView === "analysis" &&
            !selectedReport &&
            analysisReports.length > 0 && (
              <AnalysisHistory
                reports={analysisReports}
                onOpen={handleOpenAnalysis}
                onStart={handleShowResults}
              />
            )}
        </div>

        <nav className={styles.bottomNav} aria-label="경기 리포트 메뉴">
          <button
            type="button"
            className={`${styles.bottomNavButton} ${
              activeView === "results" ? styles.activeBottomNavButton : ""
            }`}
            onClick={handleShowResults}
            aria-current={activeView === "results" ? "page" : undefined}
          >
            <FiList className={styles.bottomNavIcon} aria-hidden="true" />

            <span>경기 결과</span>
          </button>

          <button
            type="button"
            className={`${styles.bottomNavButton} ${
              activeView === "analysis" ? styles.activeBottomNavButton : ""
            }`}
            onClick={handleShowAnalysisHome}
            aria-current={activeView === "analysis" ? "page" : undefined}
          >
            <FiBarChart2 className={styles.bottomNavIcon} aria-hidden="true" />

            <span>분석</span>
          </button>
        </nav>
      </section>

      <button
        type="button"
        className={`${styles.aiButton} ${isOpen ? styles.active : ""}`}
        onClick={handleTogglePanel}
        aria-label={isOpen ? "경기 리포트 닫기" : "경기 리포트 열기"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <FiX className={styles.toggleIcon} aria-hidden="true" />
        ) : (
          <>
            <span className={styles.logoFrame} aria-hidden="true">
              <img
                className={styles.buttonLogo}
                src="/fanpick_mascot.svg"
                alt=""
              />
            </span>

            <span className={styles.reportBadge}>REPORT</span>
          </>
        )}
      </button>
    </>
  );
};

export default AiReportWidget;
