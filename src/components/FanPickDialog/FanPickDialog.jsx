import { useEffect, useId } from "react";
import styles from "./FanPickDialog.module.css";

const FanPickDialog = ({
  isOpen,
  title,
  description,
  confirmText = "확인",
  cancelText = "",
  onConfirm,
  onClose,
  showCloseButton = true,
  showAccentLine = true,
  lockBodyScroll = true,
}) => {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;

    if (lockBodyScroll) {
      document.body.style.overflow = "hidden";
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (lockBodyScroll) {
        document.body.style.overflow = previousOverflow;
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, lockBodyScroll, onClose]);

  if (!isOpen) return null;

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
        {showAccentLine && <div className={styles.accentLine} />}

        {showCloseButton && (
          <button
            className={styles.closeButton}
            type="button"
            aria-label="다이얼로그 닫기"
            onClick={onClose}
          >
            ×
          </button>
        )}

        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>

        <p id={descriptionId} className={styles.description}>
          {description}
        </p>

        <div className={styles.buttonArea}>
          {cancelText && (
            <button
              className={styles.cancelButton}
              type="button"
              onClick={onClose}
            >
              {cancelText}
            </button>
          )}

          <button
            className={styles.confirmButton}
            type="button"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </section>
    </div>
  );
};

export default FanPickDialog;
