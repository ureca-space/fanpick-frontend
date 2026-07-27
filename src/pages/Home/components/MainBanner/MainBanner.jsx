import mainBannerImage from "../../../../assets/images/fanpick_banner.jpg";
import styles from "./MainBanner.module.css";

const MainBanner = () => {
  return (
    <section className={styles.mainBanner} data-main-banner>
      <img
        src={mainBannerImage}
        alt="야구, 축구, e스포츠 경기장을 표현한 FanPick 메인 배너"
        className={styles.bannerImage}
      />

      <div className={styles.overlay} />

      <h1 className={styles.bannerTitle}>
        <span className={styles.match}>FANPICK</span>
        <span className={styles.game}>MATCH DAY</span>
      </h1>
    </section>
  );
};

export default MainBanner;
