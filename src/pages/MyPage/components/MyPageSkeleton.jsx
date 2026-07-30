import Skeleton from "../../../components/Skeleton/Skeleton.jsx";
import {
  FAVORITE_TEAMS_PAGE_SIZE,
  PICK_HISTORY_PAGE_SIZE,
  PREDICTION_BADGE_CONTEXTS,
} from "../myPageUtils.js";
import styles from "../MyPage.module.css";

const MyPageSkeleton = () => (
  <main className={styles.myPage}>
    <div
      className={`container ${styles.inner}`}
      aria-label="마이페이지 로딩 중"
    >
      <header className={styles.pageHeader}>
        <Skeleton.Line className={styles.skeletonEyebrow} />
        <Skeleton.Line className={styles.skeletonPageTitle} />
        <Skeleton.Line className={styles.skeletonPageDescription} />
      </header>

      <section className={styles.profileSection}>
        <div className={styles.profileMain}>
          <Skeleton.Circle className={styles.skeletonProfileAvatar} />

          <div className={styles.profileInfo}>
            <Skeleton.Line className={styles.skeletonNickname} />
            <Skeleton.Line className={styles.skeletonEmail} />
            <Skeleton.Line className={styles.skeletonJoinedAt} />
          </div>
        </div>

        <div className={styles.profileBadges}>
          {PREDICTION_BADGE_CONTEXTS.map((sport) => (
            <article
              key={sport}
              className={`${styles.profileBadge} ${styles.skeletonStaticCard}`}
            >
              <Skeleton.Circle className={styles.skeletonBadgeIcon} />

              <div className={styles.skeletonBadgeInfo}>
                <Skeleton.Line className={styles.skeletonBadgeSport} />
                <Skeleton.Line className={styles.skeletonBadgeTitle} />
                <Skeleton.Line className={styles.skeletonBadgeText} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.badgeGuideSection}>
        <div className={styles.sectionHeader}>
          <Skeleton.Line className={styles.skeletonSectionTitle} />
          <Skeleton.Line className={styles.skeletonSectionDescription} />
        </div>

        <div className={styles.badgeGuideGrid}>
          {PREDICTION_BADGE_CONTEXTS.map((sport) => (
            <article
              key={sport}
              className={`${styles.badgeGuideCard} ${styles.skeletonStaticCard}`}
            >
              <div className={styles.skeletonBadgeGuideHeader}>
                <Skeleton.Circle className={styles.skeletonBadgeIcon} />

                <div className={styles.skeletonBadgeInfo}>
                  <Skeleton.Line className={styles.skeletonBadgeSport} />
                  <Skeleton.Line className={styles.skeletonBadgeTitle} />
                </div>
              </div>

              <div className={styles.skeletonBadgeGuideList}>
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton.Line
                    key={`${sport}-${index}`}
                    className={styles.skeletonBadgeGuideItem}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.statisticsSection}>
        <div className={styles.sectionHeader}>
          <Skeleton.Line className={styles.skeletonSectionTitle} />
          <Skeleton.Line className={styles.skeletonSectionDescription} />
        </div>

        <div className={styles.statisticsGrid}>
          {Array.from({ length: 4 }, (_, index) => (
            <article
              key={index}
              className={`${styles.statisticCard} ${styles.skeletonStaticCard}`}
            >
              <Skeleton.Line className={styles.skeletonStatLabel} />
              <Skeleton.Line className={styles.skeletonStatValue} />
            </article>
          ))}
        </div>
      </section>

      <section className={styles.favoriteTeamsSection}>
        <div className={styles.sectionHeaderWithNavigation}>
          <div className={styles.sectionHeader}>
            <Skeleton.Line className={styles.skeletonSectionTitle} />
            <Skeleton.Line className={styles.skeletonSectionDescription} />
          </div>

          <div className={styles.skeletonSectionNavigation}>
            <Skeleton.Line className={styles.skeletonPageCount} />
            <Skeleton.Circle className={styles.skeletonNavigationButton} />
            <Skeleton.Circle className={styles.skeletonNavigationButton} />
          </div>
        </div>

        <div className={styles.favoriteTeamsGrid}>
          {Array.from({ length: FAVORITE_TEAMS_PAGE_SIZE }, (_, index) => (
            <article
              key={index}
              className={`${styles.favoriteTeamCard} ${styles.skeletonStaticCard}`}
            >
              <Skeleton.Box className={styles.skeletonFavoriteLogoBox} />

              <div className={styles.favoriteTeamInfo}>
                <Skeleton.Line className={styles.skeletonFavoriteLeague} />
                <Skeleton.Line className={styles.skeletonFavoriteName} />
                <Skeleton.Line className={styles.skeletonFavoriteTone} />
                <Skeleton.Line className={styles.skeletonFavoriteToneShort} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.historySection}>
        <div className={styles.sectionHeaderWithNavigation}>
          <div className={styles.sectionHeader}>
            <Skeleton.Line className={styles.skeletonSectionTitle} />
            <Skeleton.Line className={styles.skeletonSectionDescription} />
          </div>

          <div className={styles.skeletonSectionNavigation}>
            <Skeleton.Line className={styles.skeletonPageCount} />
            <Skeleton.Circle className={styles.skeletonNavigationButton} />
            <Skeleton.Circle className={styles.skeletonNavigationButton} />
          </div>
        </div>

        <div className={styles.historyList}>
          {Array.from({ length: PICK_HISTORY_PAGE_SIZE }, (_, index) => (
            <article
              key={index}
              className={`${styles.historyCard} ${styles.skeletonStaticCard}`}
            >
              <div className={styles.historyMeta}>
                <Skeleton.Line className={styles.skeletonHistoryMeta} />
                <Skeleton.Line className={styles.skeletonHistoryResult} />
              </div>

              <div className={styles.historyDate}>
                <Skeleton.Line className={styles.skeletonHistoryDate} />
                <Skeleton.Line className={styles.skeletonHistoryTime} />
              </div>

              <div className={styles.historyTeams}>
                <Skeleton.Line className={styles.skeletonHistoryTeam} />
                <Skeleton.Line className={styles.skeletonHistoryScore} />
                <Skeleton.Line className={styles.skeletonHistoryTeam} />
              </div>

              <div className={styles.historyPrediction}>
                <div className={styles.historyPredictionLabels}>
                  <Skeleton.Line className={styles.skeletonPredictionLabel} />
                  <Skeleton.Line className={styles.skeletonPredictionLabel} />
                </div>

                <Skeleton.Line className={styles.skeletonPredictionBar} />
              </div>

              <div className={styles.historyFooter}>
                <Skeleton.Line className={styles.skeletonHistoryPick} />
                <Skeleton.Line className={styles.skeletonHistoryButton} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  </main>
);

export default MyPageSkeleton;
