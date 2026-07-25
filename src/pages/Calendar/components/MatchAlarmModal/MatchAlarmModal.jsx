import { useEffect, useId, useMemo, useState } from "react";
import styles from "./MatchAlarmModal.module.css";

const PRESET_OPTIONS = [
  { id: "60", label: "1시간 전", minutes: 60 },
  { id: "30", label: "30분 전", minutes: 30 },
  { id: "10", label: "10분 전", minutes: 10 },
  { id: "5", label: "5분 전", minutes: 5 },
];

const CUSTOM_UNITS = [
  { id: "minutes", label: "분 전", multiplier: 1 },
  { id: "hours", label: "시간 전", multiplier: 60 },
];

const formatScheduleLabel = (match) => {
  const datePart = match?.date ? match.date.replaceAll("-", ".") : "날짜 미정";
  const timePart = match?.time || "시간 미정";

  return `${datePart} · ${timePart}`;
};

const buildPreviewLabel = ({ selectedPresetId, customAmount, customUnit }) => {
  if (selectedPresetId === "custom") {
    const amount = customAmount || 0;
    const unitLabel = CUSTOM_UNITS.find(
      (unit) => unit.id === customUnit,
    )?.label;

    return `경기 시작 ${amount}${unitLabel} 알림`;
  }

  const presetLabel =
    PRESET_OPTIONS.find((option) => option.id === selectedPresetId)?.label ||
    "기본 알림";

  return `경기 시작 ${presetLabel} 알림`;
};

const MatchAlarmModal = ({ match, isOpen, onClose }) => {
  const titleId = useId();
  const descriptionId = useId();
  const [selectedPresetId, setSelectedPresetId] = useState("60");
  const [customAmount, setCustomAmount] = useState("15");
  const [customUnit, setCustomUnit] = useState("minutes");

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedPresetId("60");
    setCustomAmount("15");
    setCustomUnit("minutes");
  }, [isOpen, match?.id]);

  const matchTitle = useMemo(() => {
    const homeName = match?.homeTeam?.shortName || match?.homeTeam?.name || "-";
    const awayName = match?.awayTeam?.shortName || match?.awayTeam?.name || "-";

    return `${homeName} vs ${awayName}`;
  }, [match]);

  const previewLabel = buildPreviewLabel({
    selectedPresetId,
    customAmount,
    customUnit,
  });

  if (!isOpen || !match) {
    return null;
  }

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className={styles.header}>
          <div>
            <p className={styles.kicker}>MATCH ALERT</p>
            <h2 id={titleId} className={styles.title}>
              알림 설정
            </h2>
          </div>

          <button
            className={styles.closeButton}
            type="button"
            aria-label="모달 닫기"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p id={descriptionId} className={styles.description}>
          {matchTitle} 경기를 기준으로 알림 시간을 미리 맞춰볼 수 있어요.
        </p>

        <article className={styles.matchCard}>
          <div className={styles.matchInfo}>
            <span className={styles.matchLabel}>{matchTitle}</span>
            <span className={styles.matchMeta}>
              {match?.sportLabel || "SPORT"} · {match?.league || "LEAGUE"}
            </span>
          </div>

          <div className={styles.matchDetails}>
            <span>{formatScheduleLabel(match)}</span>
            <span>{match?.venue || "장소 미정"}</span>
          </div>
        </article>

        <div className={styles.controlGroup}>
          <h3 className={styles.sectionTitle}>알림 시간</h3>
          <div className={styles.presetGrid}>
            {PRESET_OPTIONS.map((option) => (
              <label key={option.id} className={styles.presetOption}>
                <input
                  type="radio"
                  name="alarmPreset"
                  value={option.id}
                  checked={selectedPresetId === option.id}
                  onChange={() => setSelectedPresetId(option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}

            <label className={styles.presetOption}>
              <input
                type="radio"
                value="custom"
                checked={selectedPresetId === "custom"}
                onChange={() => setSelectedPresetId("custom")}
              />
              <span>직접 설정</span>
            </label>
          </div>

          <div className={styles.customArea}>
            <div className={styles.customInputGroup}>
              <label className={styles.fieldLabel} htmlFor="alarm-custom-value">
                시간
              </label>
              <input
                id="alarm-custom-value"
                className={styles.numberInput}
                type="number"
                min="1"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                disabled={selectedPresetId !== "custom"}
              />
            </div>

            <div className={styles.customInputGroup}>
              <label className={styles.fieldLabel} htmlFor="alarm-custom-unit">
                단위
              </label>
              <select
                id="alarm-custom-unit"
                className={styles.selectInput}
                value={customUnit}
                onChange={(event) => setCustomUnit(event.target.value)}
                disabled={selectedPresetId !== "custom"}
              >
                {CUSTOM_UNITS.map((unit) => (
                  <option
                    key={unit.id}
                    value={unit.id}
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.previewCard}>
          <span className={styles.previewLabel}>미리보기</span>
          <strong className={styles.previewValue}>{previewLabel}</strong>
        </div>

        <div className={styles.buttonArea}>
          <button
            className={styles.cancelButton}
            type="button"
            onClick={onClose}
          >
            닫기
          </button>
          <button
            className={styles.confirmButton}
            type="button"
            onClick={onClose}
          >
            저장하기
          </button>
        </div>
      </section>
    </div>
  );
};

export default MatchAlarmModal;
