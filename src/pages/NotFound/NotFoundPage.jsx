import { Link } from "react-router";
import styles from "./NotFoundPage.module.css";

const NotFoundPage = () => {
  return (
    <section className={styles.notFoundPage}>
      <div className={styles.container}>
        <div className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9.5" />
            <circle className={styles.iconDot} cx="12" cy="7.5" r="1" />
            <path d="M10.8 11H12v5.5h1.2" />
          </svg>
        </div>

        <h1 className={styles.title}>해당 페이지에 진입할 수 없습니다.</h1>

        <p className={styles.description}>홈화면으로 이동합니다.</p>

        <Link className={styles.homeButton} to="/">
          확인
        </Link>
      </div>
    </section>
  );
};

export default NotFoundPage;
