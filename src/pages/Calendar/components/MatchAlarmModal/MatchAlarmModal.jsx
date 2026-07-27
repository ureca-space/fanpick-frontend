import { useEffect, useId, useMemo, useState } from "react";
import styles from "./MatchAlarmModal.module.css";

const PRESET_OPTIONS = [
  { id: "60", label: "1시간 전", minutes: 60 },
  { id: "30", label: "30분 전", minutes: 30 },
  { id: "10", label: "10분 전", minutes: 10 },
  { id: "5", label: "5분 전", minutes: 5 },
];

const CUSTOM_UNITS = [
  { id: "minutes", label: "분", multiplier: 1 },
  { id: "hours", label: "시간", multiplier: 60 },
];

const getReminderSettingsFromAlarm = (alarm, fallbackSettings) => {
  const payload = alarm?.payload ?? {};

  return {
    presetId: String(payload.presetId ?? fallbackSettings?.presetId ?? "60"),
    customAmount: String(
      payload.customAmount ?? fallbackSettings?.customAmount ?? "15",
    ),
    customUnit:
      payload.customUnit === "hours"
        ? "hours"
        : fallbackSettings?.customUnit ?? "minutes",
  };
};

const formatScheduleLabel = (match) => {
  const datePart = match?.date ? match.date.replaceAll("-", ".") : "날짜 미정";
  const timePart = match?.time || "시간 미정";

  return `${datePart} · ${timePart}`;
};

const buildPreviewLabel = ({ selectedPresetId, customAmount, customUnit }) => {
  if (selectedPresetId === "custom") {
    const amount = customAmount || 0;
    const unitLabel = CUSTOM_UNITS.find((unit) => unit.id === customUnit)?.label;

    return `경기 시작 ${amount}${unitLabel} 전 알림`;
  }

  const presetLabel =
    PRESET_OPTIONS.find((option) => option.id === selectedPresetId)?.label ||
    "기본 알림";

  return `경기 시작 ${presetLabel} 알림`;
};

const buildSelectionLabel = ({ selectedPresetId, customAmount, customUnit }) => {
  if (selectedPresetId === "custom") {
    const unitLabel = customUnit === "hours" ? "시간" : "분";

    return `${customAmount || 0}${unitLabel} 전`;
  }

  const presetLabel =
    PRESET_OPTIONS.find((option) => option.id === selectedPresetId)?.label ||
    "기본";

  return presetLabel;
};

const MatchAlarmModal = ({
  match,
  isOpen,
  onClose,
  onConfirm,
  onDelete,
  defaultReminderSettings,
  existingAlarm,
  isAlarmLoading = false,
  canSaveAlarm = true,
}) => {
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
    if (!isOpen || isAlarmLoading) {
      return;
    }

    const nextSettings = existingAlarm
      ? getReminderSettingsFromAlarm(existingAlarm, defaultReminderSettings)
      : defaultReminderSettings;

    setSelectedPresetId(nextSettings?.presetId || "60");
    setCustomAmount(nextSettings?.customAmount || "15");
    setCustomUnit(nextSettings?.customUnit || "minutes");
  }, [
    defaultReminderSettings,
    existingAlarm,
    isAlarmLoading,
    isOpen,
    match?.id,
  ]);

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
  const selectionLabel = buildSelectionLabel({
    selectedPresetId,
    customAmount,
    customUnit,
  });
  const hasExistingAlarm = Boolean(existingAlarm?.id);
  const actionsDisabled = isAlarmLoading;
  const saveDisabled = actionsDisabled || !canSaveAlarm;

  if (!isOpen || !match) {
    return null;
  }

  if (!canSaveAlarm) {
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
                알림 설정 불가
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
            {matchTitle} 경기는 종료, 취소, 연기 상태라 알림을 설정할 수 없어요.
          </p>

          <div className={styles.unavailableCard}>
            <strong className={styles.unavailableTitle}>설정할 수 없는 경기예요</strong>
            <span className={styles.unavailableText}>
              종료, 취소, 연기된 경기는 알림 저장이 지원되지 않습니다.
            </span>
          </div>

          <div className={styles.buttonArea}>
            <button className={styles.confirmButton} type="button" onClick={onClose}>
              닫기
            </button>
          </div>
        </section>
      </div>
    );
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
          {matchTitle} 경기 시작 전에 알림을 받을 시간을 설정해 주세요.
        </p>

        <div className={styles.statusRow}>
          {isAlarmLoading ? (
            <span className={styles.statusBadge}>기존 알림을 확인 중...</span>
          ) : hasExistingAlarm ? (
            <div className={styles.selectionGroup}>
              <span className={`${styles.statusBadge} ${styles.statusBadgeSuccess}`}>
                이미 알림 설정이 된 경기
              </span>
              <span className={styles.currentSelectionBadge}>
                현재 선택: {selectionLabel}
              </span>
            </div>
          ) : (
            <span className={styles.statusBadge}>아직 설정된 알림이 없습니다.</span>
          )}
        </div>

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
              <label
                key={option.id}
                className={[
                  styles.presetOption,
                  selectedPresetId === option.id
                    ? styles.presetOptionSelected
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <input
                  type="radio"
                  name="alarmPreset"
                  value={option.id}
                  checked={selectedPresetId === option.id}
                  onChange={() => setSelectedPresetId(option.id)}
                  disabled={actionsDisabled}
                />
                <span>{option.label}</span>
              </label>
            ))}

            <label
              className={[
                styles.presetOption,
                selectedPresetId === "custom"
                  ? styles.presetOptionSelected
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                type="radio"
                value="custom"
                checked={selectedPresetId === "custom"}
                onChange={() => setSelectedPresetId("custom")}
                disabled={actionsDisabled}
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
                disabled={selectedPresetId !== "custom" || actionsDisabled}
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
                disabled={selectedPresetId !== "custom" || actionsDisabled}
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
            disabled={saveDisabled}
          >
            닫기
          </button>

          {hasExistingAlarm ? (
            <button
              className={styles.deleteButton}
              type="button"
              onClick={() => onDelete?.()}
              disabled={actionsDisabled}
            >
              알림 해제
            </button>
          ) : null}

          <button
            className={styles.confirmButton}
            type="button"
            onClick={() =>
              onConfirm?.({
                presetId: selectedPresetId,
                customAmount,
                customUnit,
              })
            }
            disabled={saveDisabled}
          >
            {hasExistingAlarm ? "알림 수정" : "알림 저장"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default MatchAlarmModal;
