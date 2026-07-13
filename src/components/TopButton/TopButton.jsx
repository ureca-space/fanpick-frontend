import { useEffect, useState } from "react";
import styles from "./TopButton.module.css";

const TopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      className={`${styles.topButton} ${isVisible ? styles.visible : ""}`}
      onClick={handleScrollToTop}
      aria-label="페이지 맨 위로 이동"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 19V5M12 5L6 11M12 5L18 11" />
      </svg>
    </button>
  );
};

export default TopButton;
