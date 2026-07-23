import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/EmptyState/EmptyState";
import useAuth from "../../contexts/useAuth";
import { fetchCommunityPosts } from "../../services/communityApi";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import styles from "./CommunityPage.module.css";

// eslint-disable-next-line react-refresh/only-export-components
export const CATEGORIES = [
  { id: "all", label: "전체 게시글" },
  { id: "lck", label: "LCK" },
  { id: "baseball", label: "KBO" },
  { id: "soccer", label: "K-LEAGUE" },
];
const BOARD_FILTERS = [
  { id: "all", label: "전체 게시글" },
  ...CATEGORIES.slice(1),
  { id: "my-posts", label: "작성한 글" },
  { id: "my-comments", label: "작성한 댓글" },
];

const PAGE_SIZE = 10;
const INITIAL_TIME = Date.now();
const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((item) => [item.id, item.label]),
);
const formatAuthorName = (name = "") =>
  name.length > 4 ? `${name.slice(0, 3)}...` : name;

const CommunityPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(INITIAL_TIME);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        setPosts(await fetchCommunityPosts(user?.id));
      } catch (error) {
        console.error("커뮤니티 게시글 조회 오류:", error);
        setErrorMessage("게시글을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [user?.id]);

  const selectedCategory = BOARD_FILTERS.find((item) => item.id === category);
  const filteredPosts = useMemo(() => {
    let nextPosts = [...posts];

    if (category === "my-posts") {
      nextPosts = posts.filter((post) => post.user_id === user?.id);
    } else if (category === "my-comments") {
      nextPosts = posts.filter((post) => post.hasMyComment);
    } else if (category !== "all") {
      nextPosts = posts.filter((post) => post.category === category);
    }

    return nextPosts.sort((a, b) =>
      sortBy === "popular"
        ? b.view_count - a.view_count
        : new Date(b.created_at) - new Date(a.created_at),
    );
  }, [category, posts, sortBy, user?.id]);

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

  const changePage = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
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
              {BOARD_FILTERS.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  className={[
                    category === item.id ? styles.activeCategory : "",
                    index === 4 ? styles.categoryStart : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
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
            {!isLoading && !errorMessage && filteredPosts.length === 0 && (
              <EmptyState
                title={
                  category === "my-posts"
                    ? "작성한 게시글이 없습니다."
                    : category === "my-comments"
                      ? "댓글을 작성한 게시글이 없습니다."
                      : "등록된 게시글이 없습니다."
                }
                description={
                  category === "all"
                    ? "첫 번째 이야기를 남겨보세요."
                    : undefined
                }
              />
            )}
            {!isLoading && !errorMessage && filteredPosts.length > 0 && (
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
                        {!CATEGORIES.some(
                          (item) =>
                            item.id !== "all" && item.id === category,
                        ) && (
                          <small className={styles.postCategory}>
                            {CATEGORY_LABELS[post.category]}
                          </small>
                        )}
                        {post.title}
                        <b>({post.commentCount})</b>
                      </span>
                      <span title={post.author_name}>
                        {formatAuthorName(post.author_name)}
                      </span>
                      <span>
                        {formatRelativeTime(post.created_at, currentTime)}
                      </span>
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
                      onClick={() => changePage(pageNumber)}
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
                    <b>({post.commentCount.toLocaleString()})</b>
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
