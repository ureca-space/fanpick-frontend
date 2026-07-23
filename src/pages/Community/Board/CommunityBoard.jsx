import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./CommunityBoard.module.css";

// eslint-disable-next-line react-refresh/only-export-components
export const CATEGORIES = [
  { id: "all", label: "전체 게시글" },
  { id: "lck", label: "LCK" },
  { id: "baseball", label: "KBO" },
  { id: "soccer", label: "K-LEAGUE" },
];

// - Supabase 연결 전 화면 확인용 게시글
// eslint-disable-next-line react-refresh/only-export-components
export const MOCK_POSTS = [
  {
    id: 1,
    category: "lck",
    title: "페이커 은퇴하면 과연 그들은...",
    author: "롤로노아",
    date: "07.22",
    views: 561,
    likes: 43,
    comments: 43,
  },
  {
    id: 2,
    category: "lck",
    title: "GOAT",
    author: "롤로노아",
    date: "07.22",
    views: 488,
    likes: 34,
    comments: 7,
  },
  {
    id: 3,
    category: "lck",
    title: "어제 경기를 보고 드는 생각",
    author: "티원팬",
    date: "07.22",
    views: 421,
    likes: 26,
    comments: 13,
  },
  {
    id: 4,
    category: "lck",
    title: "티원팬이 아닌 나조차도",
    author: "롤로노아",
    date: "07.22",
    views: 397,
    likes: 21,
    comments: 11,
  },
  {
    id: 5,
    category: "baseball",
    title: "오늘 잠실 경기 선발 라인업",
    author: "야구광",
    date: "07.21",
    views: 365,
    likes: 18,
    comments: 9,
  },
  {
    id: 6,
    category: "soccer",
    title: "이번 라운드 최고의 골은?",
    author: "축구팬",
    date: "07.21",
    views: 352,
    likes: 17,
    comments: 12,
  },
  {
    id: 7,
    category: "lck",
    title: "이번 주 LCK 경기 예상",
    author: "소환사",
    date: "07.21",
    views: 318,
    likes: 15,
    comments: 8,
  },
  {
    id: 8,
    category: "baseball",
    title: "후반기 순위 경쟁 재밌겠다",
    author: "직관러",
    date: "07.20",
    views: 294,
    likes: 13,
    comments: 6,
  },
  {
    id: 9,
    category: "soccer",
    title: "주말 경기 직관 후기",
    author: "붉은악마",
    date: "07.20",
    views: 277,
    likes: 11,
    comments: 5,
  },
  {
    id: 10,
    category: "lck",
    title: "신인 선수 중 누가 제일 기대돼?",
    author: "롤로노아",
    date: "07.19",
    views: 251,
    likes: 9,
    comments: 10,
  },
  {
    id: 11,
    category: "baseball",
    title: "오늘 경기 승부 예측",
    author: "야구광",
    date: "07.19",
    views: 229,
    likes: 8,
    comments: 4,
  },
  {
    id: 12,
    category: "soccer",
    title: "이적시장 소식 정리",
    author: "축구팬",
    date: "07.18",
    views: 208,
    likes: 7,
    comments: 3,
  },
];

const PAGE_SIZE = 8;

const CommunityBoard = () => {
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);

  const selectedCategory = CATEGORIES.find((item) => item.id === category);

  const filteredPosts = useMemo(() => {
    const posts =
      category === "all"
        ? [...MOCK_POSTS]
        : MOCK_POSTS.filter((post) => post.category === category);

    return posts.sort((a, b) =>
      sortBy === "popular" ? b.views - a.views : b.id - a.id,
    );
  }, [category, sortBy]);

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
            <h1>{selectedCategory?.label ?? "전체 게시글"}</h1>

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

          <div className={styles.postTable}>
            <div className={`${styles.postRow} ${styles.tableHeader}`}>
              <span>제목</span>
              <span>작성자</span>
              <span>작성일</span>
              <span>조회수</span>
              <span>버프</span>
            </div>

            {visiblePosts.map((post) => (
              <Link
                to={`/community/${post.id}`}
                className={styles.postRow}
                key={post.id}
              >
                <span className={styles.postTitle}>
                  {post.title}
                  <b>({post.comments})</b>
                </span>
                <span>{post.author}</span>
                <span>{post.date}</span>
                <span>{post.views.toLocaleString()}</span>
                <span>{post.likes}</span>
              </Link>
            ))}
          </div>

          <div className={styles.pagination} aria-label="페이지 이동">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  type="button"
                  key={pageNumber}
                  className={
                    currentPage === pageNumber ? styles.activePage : ""
                  }
                  onClick={() => setCurrentPage(pageNumber)}
                  aria-current={currentPage === pageNumber ? "page" : undefined}
                >
                  {pageNumber}
                </button>
              ),
            )}
          </div>
        </main>

        <aside className={styles.popularPanel}>
          <h2>커뮤니티 인기글</h2>
          <ul>
            {MOCK_POSTS.slice()
              .sort((a, b) => b.views - a.views)
              .slice(0, 3)
              .map((post) => (
                <li key={post.id}>
                  <Link to={`/community/${post.id}`}>
                    <span>{post.title}</span>
                    <b>({post.views.toLocaleString()})</b>
                  </Link>
                </li>
              ))}
          </ul>
        </aside>
    </div>
  );
};

export default CommunityBoard;
