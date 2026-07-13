import mainBannerImage from "../../assets/images/fanpick_banner.webp";
import styles from "./MainBanner.module.css";

const MainBanner = () => {
  return (
    <section className={styles.mainBanner}>
      <img
        src={mainBannerImage}
        alt="야구, 축구, 농구, e스포츠를 표현한 FanPick 메인 배너"
        className={styles.bannerImage}
      />

      <div className={styles.overlay} />

      <h1 className={styles.bannerTitle}>
        <span className={styles.match}>MATCH</span>
        <span className={styles.game}>GAME</span>
      </h1>
    </section>
  );
};

export default MainBanner;
