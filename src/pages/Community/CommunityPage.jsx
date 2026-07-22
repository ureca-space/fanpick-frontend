import EmptyState from "../../components/EmptyState/EmptyState";
import styles from "./CommunityPage.module.css";

const CommunityPage = () => {
  return (
    <section className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>FANPICK COMMUNITY</p>
          <h1 className={styles.title}>COMMUNITY</h1>
        </header>

        <EmptyState
          title="등록된 게시글이 없습니다."
          description="커뮤니티 게시글이 등록되면 이곳에 표시됩니다."
        />
      </div>
    </section>
  );
};

export default CommunityPage;
