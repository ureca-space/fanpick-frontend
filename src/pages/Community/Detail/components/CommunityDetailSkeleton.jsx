import Skeleton from "../../../../components/Skeleton/Skeleton";
import CommunitySidebars from "../../components/CommunitySidebars/CommunitySidebars";
import styles from "../CommunityDetailPage.module.css";

const CommunityDetailSkeleton = () => (
  <section className={styles.page} aria-label="게시글 불러오는 중">
    <div className={`container ${styles.layout}`}>
      <CommunitySidebars isPopularLoading popularPosts={[]} />

      <main className={styles.mainArea}>
        <div className={styles.pageControls}>
          <Skeleton.Box className={styles.skeletonControl} />

          <div>
            <Skeleton.Box className={styles.skeletonControl} />
            <Skeleton.Box className={styles.skeletonControl} />
          </div>
        </div>

        <article className={`${styles.article} ${styles.detailSkeleton}`}>
          <div className={styles.articleHeader}>
            <Skeleton.Line className={styles.skeletonCategory} />
            <Skeleton.Line className={styles.skeletonTitle} />

            <div className={styles.authorInfo}>
              <Skeleton.Circle className={styles.skeletonAvatar} />

              <div>
                <Skeleton.Line className={styles.skeletonAuthor} />
                <Skeleton.Line className={styles.skeletonMeta} />
              </div>
            </div>
          </div>

          <div className={styles.articleContent}>
            <div className={styles.skeletonContentLines}>
              {["92%", "80%", "68%", "88%", "74%", "52%"].map((width) => (
                <Skeleton.Line
                  className={styles.skeletonContentLine}
                  key={width}
                  width={width}
                />
              ))}
            </div>
          </div>

          <div className={styles.commentSection}>
            <Skeleton.Line className={styles.skeletonCommentTitle} />

            <Skeleton.Box className={styles.skeletonCommentBox} />

            <div className={styles.skeletonCommentList}>
              {Array.from({ length: 4 }, (_, index) => (
                <div className={styles.skeletonCommentItem} key={index}>
                  <Skeleton.Circle className={styles.skeletonSmallAvatar} />

                  <div>
                    <Skeleton.Line className={styles.skeletonAuthor} />
                    <Skeleton.Line className={styles.skeletonCommentLine} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </main>
    </div>
  </section>
);

export default CommunityDetailSkeleton;
