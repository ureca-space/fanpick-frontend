import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiMessageCircle, FiSend } from "react-icons/fi";
import {
  getMatchDescription,
  getMatchTitle,
  replaceTeamCodes,
} from "../aiReportUtils";
import styles from "../AiReportWidget.module.css";

const TYPEWRITER_SPEED_MS = 18;
const NEXT_MESSAGE_DELAY_MS = 300;

export const AnalysisEmptyState = ({ onStart }) => (
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

export const AnalysisHistory = ({ reports, onOpen, onStart }) => (
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

export const AnalysisConversation = ({
  isRevealed,
  onBack,
  onReveal,
  report,
}) => {
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
