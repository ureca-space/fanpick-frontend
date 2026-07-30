import { useEffect, useMemo, useState } from "react";
import { FiBarChart2, FiList, FiSend, FiX } from "react-icons/fi";
import { fetchMatchAiReports } from "../../services/matchAiReportService.js";
import {
  FILTERS,
  SPORT_LABELS,
  formatMatchDate,
  formatMatchTime,
  formatScore,
  getResultLabel,
  getTeamName,
  sortReports,
} from "./aiReportUtils";
import {
  AnalysisConversation,
  AnalysisEmptyState,
  AnalysisHistory,
} from "./components/AnalysisViews";
import styles from "./AiReportWidget.module.css";

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
