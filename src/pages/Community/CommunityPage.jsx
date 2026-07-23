import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/EmptyState/EmptyState";
import { fetchCommunityPosts } from "../../services/communityApi";
import styles from "./CommunityPage.module.css";

// eslint-disable-next-line react-refresh/only-export-components
export const CATEGORIES = [
  { id: "all", label: "전체 게시글" },
  { id: "lck", label: "LCK" },
  { id: "baseball", label: "KBO" },
  { id: "soccer", label: "K-LEAGUE" },
];

const PAGE_SIZE = 10;

const formatDate = (date) => {
  const value = new Date(date);
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${month}.${day}`;
};

const CommunityPage = () => {
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        setPosts(await fetchCommunityPosts());
      } catch (error) {
        console.error("커뮤니티 게시글 조회 오류:", error);
        setErrorMessage("게시글을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, []);

  const selectedCategory = CATEGORIES.find((item) => item.id === category);
  const filteredPosts = useMemo(() => {
    const nextPosts =
      category === "all"
        ? [...posts]
        : posts.filter((post) => post.category === category);

    return nextPosts.sort((a, b) =>
      sortBy === "popular"
        ? b.view_count - a.view_count
        : new Date(b.created_at) - new Date(a.created_at),
    );
  }, [category, posts, sortBy]);

  const popularPosts = useMemo(
    () => [...posts].sort((a, b) => b.view_count - a.view_count).slice(0, 10),
    [posts],
  );
  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const visiblePosts = filteredPosts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const changeCategory = (nextCategory) => {
    setCategory(nextCategory);
    setCurrentPage(1);
  };

  const changeSort = (nextSort) => {
    setSortBy(nextSort);
    setCurrentPage(1);
  };

  return (
    <section className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>FANPICK COMMUNITY</p>
          <h1 className={styles.title}>COMMUNITY</h1>
        </header>

        <div className={styles.layout}>
          <aside className={styles.categoryPanel}>
            <Link to="/community/write" className={styles.writeButton}>
              글쓰기
            </Link>
            <nav className={styles.categoryNav} aria-label="게시판 카테고리">
              {CATEGORIES.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={category === item.id ? styles.activeCategory : ""}
                  onClick={() => changeCategory(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className={styles.board}>
            <div className={styles.boardHeader}>
              <h2>{selectedCategory?.label ?? "전체 게시글"}</h2>
              <div className={styles.sortButtons} aria-label="게시글 정렬">
                <button
                  type="button"
                  className={sortBy === "popular" ? styles.activeSort : ""}
                  onClick={() => changeSort("popular")}
                >
                  인기순
                </button>
                <button
                  type="button"
                  className={sortBy === "latest" ? styles.activeSort : ""}
                  onClick={() => changeSort("latest")}
                >
                  최신순
                </button>
              </div>
            </div>

            {isLoading && (
              <div
                className={styles.loadingSpace}
                aria-label="게시글 불러오는 중"
              />
            )}
            {!isLoading && errorMessage && <EmptyState title={errorMessage} />}
            {!isLoading && !errorMessage && posts.length === 0 && (
              <EmptyState
                title="등록된 게시글이 없습니다."
                description="첫 번째 이야기를 남겨보세요."
              />
            )}
            {!isLoading && !errorMessage && posts.length > 0 && (
              <>
                <div className={styles.postTable}>
                  <div className={`${styles.postRow} ${styles.tableHeader}`}>
                    <span>제목</span>
                    <span>작성자</span>
                    <span>작성일</span>
                    <span>조회수</span>
                  </div>
                  {visiblePosts.map((post) => (
                    <Link
                      to={`/community/${post.id}`}
                      className={styles.postRow}
                      key={post.id}
                    >
                      <span className={styles.postTitle}>
                        {post.title}
                        <b>({post.commentCount})</b>
                      </span>
                      <span>{post.author_name}</span>
                      <span>{formatDate(post.created_at)}</span>
                      <span>{post.view_count.toLocaleString()}</span>
                    </Link>
                  ))}
                </div>

                <div className={styles.pagination} aria-label="페이지 이동">
                  {Array.from(
                    { length: pageCount },
                    (_, index) => index + 1,
                  ).map((pageNumber) => (
                    <button
                      type="button"
                      key={pageNumber}
                      className={
                        currentPage === pageNumber ? styles.activePage : ""
                      }
                      onClick={() => setCurrentPage(pageNumber)}
                      aria-current={
                        currentPage === pageNumber ? "page" : undefined
                      }
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>
              </>
            )}
          </main>

          <aside className={styles.popularPanel}>
            <h2>커뮤니티 인기글</h2>
            <ul>
              {popularPosts.map((post) => (
                <li key={post.id}>
                  <Link to={`/community/${post.id}`}>
                    <span>{post.title}</span>
                    <b>({post.view_count.toLocaleString()})</b>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default CommunityPage;
