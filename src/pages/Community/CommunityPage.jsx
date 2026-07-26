import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";
import { Link, useSearchParams } from "react-router-dom";
import EmptyState from "../../components/EmptyState/EmptyState";
import Skeleton from "../../components/Skeleton/Skeleton";
import useAuth from "../../contexts/useAuth";
import {
  fetchCommunityPosts,
  fetchMyCommunityComments,
} from "../../services/communityApi";
import { subscribeToCommunityChanges } from "../../services/communityRealtime";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import useRelativeTimeClock from "../../hooks/useRelativeTimeClock";
import {
  CommunityCategoryPanel,
  CommunityPopularPanel,
} from "./components/CommunitySidebars/CommunitySidebars";
import CommunitySubNav from "./components/CommunitySubNav/CommunitySubNav";
import { BOARD_FILTERS, CATEGORIES } from "./communityConstants";
import styles from "./CommunityPage.module.css";

const PAGE_SIZE = 10;
const MAX_VISIBLE_PAGE_COUNT = 5;
const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((item) => [item.id, item.label]),
);
const formatAuthorName = (name = "") =>
  name.length > 4 ? `${name.slice(0, 3)}...` : name;
const formatPostTitle = (title = "") =>
  title.length > 34 ? `${title.slice(0, 34)}...` : title;

const getVisiblePageNumbers = (currentPage, pageCount) => {
  const visibleCount = Math.min(MAX_VISIBLE_PAGE_COUNT, pageCount);
  const halfVisibleCount = Math.floor(visibleCount / 2);
  const startPage = Math.min(
    Math.max(1, currentPage - halfVisibleCount),
    pageCount - visibleCount + 1,
  );

  return Array.from({ length: visibleCount }, (_, index) => startPage + index);
};

const CommunityTableSkeleton = () => (
  <div className={styles.postTable} aria-label="게시글 불러오는 중">
    <div className={`${styles.postRow} ${styles.tableHeader}`}>
      <Skeleton.Line className={styles.skeletonHeaderTitle} />
      <Skeleton.Line className={styles.skeletonHeaderMeta} />
      <Skeleton.Line className={styles.skeletonHeaderMeta} />
      <Skeleton.Line className={styles.skeletonHeaderMeta} />
      <Skeleton.Line className={styles.skeletonHeaderMeta} />
    </div>

    {Array.from({ length: PAGE_SIZE }, (_, index) => (
      <div className={styles.postRow} key={index}>
        <Skeleton.Line className={styles.skeletonPostTitle} />
        <Skeleton.Line className={styles.skeletonPostAuthor} />
        <Skeleton.Line className={styles.skeletonPostDate} />
        <Skeleton.Line className={styles.skeletonPostViews} />
        <Skeleton.Line className={styles.skeletonPostViews} />
      </div>
    ))}
  </div>
);

const CommunityPaginationSkeleton = () => (
  <div className={styles.pagination} aria-hidden="true">
    {Array.from({ length: 9 }, (_, index) => (
      <Skeleton.Box className={styles.skeletonPageButton} key={index} />
    ))}
  </div>
);

const CommunityPage = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFilter = searchParams.get("filter");
  const requestedPage = Number(searchParams.get("page"));
  const category = BOARD_FILTERS.some(
    (item) => item.id === requestedFilter,
  )
    ? requestedFilter
    : "all";
  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [posts, setPosts] = useState([]);
  const [myComments, setMyComments] = useState([]);
  const [sortBy, setSortBy] = useState("latest");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const currentTime = useRelativeTimeClock();
  const contentStartRef = useRef(null);

  const loadPosts = useCallback(
    async ({ showLoading = true } = {}) => {
      try {
        if (showLoading) {
          setIsLoading(true);
        }

        setErrorMessage("");
        const [postData, commentData] = await Promise.all([
          fetchCommunityPosts(),
          fetchMyCommunityComments(userId),
        ]);

        setPosts(postData);
        setMyComments(commentData);
      } catch (error) {
        console.error("커뮤니티 게시글 조회 오류:", error);
        setErrorMessage("게시글을 불러오지 못했습니다.");
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [userId],
  );

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadPosts();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [loadPosts]);

  useEffect(() => {
    const unsubscribe = subscribeToCommunityChanges({
      channelName: "community-post-list",
      onChange: () => loadPosts({ showLoading: false }),
    });

    return unsubscribe;
  }, [loadPosts]);

  const selectedCategory = BOARD_FILTERS.find((item) => item.id === category);
  const filteredPosts = useMemo(() => {
    let nextPosts = [...posts];

    if (category === "my-posts") {
      nextPosts = posts.filter((post) => post.user_id === userId);
    } else if (category === "my-comments") {
      const postsById = new Map(posts.map((post) => [post.id, post]));

      nextPosts = myComments
        .map((comment) => {
          const post = postsById.get(comment.post_id);

          if (!post) return null;

          return {
            ...post,
            id: `comment-${comment.id}`,
            destinationId: post.id,
            title: comment.content,
            postTitle: post.title,
            created_at: comment.created_at,
            isMyComment: true,
          };
        })
        .filter(Boolean);
    } else if (category !== "all") {
      nextPosts = posts.filter((post) => post.category === category);
    }

    return nextPosts.sort((a, b) => {
      if (sortBy === "popular") {
        return b.view_count - a.view_count;
      }

      if (sortBy === "support") {
        return b.supportCount - a.supportCount;
      }

      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [category, myComments, posts, sortBy, userId]);

  const popularPosts = useMemo(
    () => [...posts].sort((a, b) => b.view_count - a.view_count).slice(0, 10),
    [posts],
  );
  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, pageCount);
  const visiblePosts = filteredPosts.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE,
  );
  const visiblePageNumbers = getVisiblePageNumbers(activePage, pageCount);
  const isFirstPage = activePage === 1;
  const isLastPage = activePage === pageCount;

  const changeCategory = (nextCategory) => {
    setSearchParams(nextCategory === "all" ? {} : { filter: nextCategory });
  };

  const changeSort = (nextSort) => {
    setSortBy(nextSort);
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("page");
    setSearchParams(nextSearchParams);
  };

  const changePage = (pageNumber) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (pageNumber === 1) {
      nextSearchParams.delete("page");
    } else {
      nextSearchParams.set("page", String(pageNumber));
    }

    setSearchParams(nextSearchParams);
    window.requestAnimationFrame(() => {
      if (!contentStartRef.current) return;

      const headerHeight =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--header-height",
          ),
        ) || 0;
      const contentGap = window.matchMedia("(max-width: 1100px)").matches
        ? 32
        : 48;
      const subNavHeight = window.matchMedia("(max-width: 900px)").matches
        ? 66
        : 74;

      window.scrollTo({
        behavior: "smooth",
        top:
          contentStartRef.current.getBoundingClientRect().top +
          window.scrollY -
          headerHeight -
          subNavHeight -
          contentGap,
      });
    });
  };

  return (
    <>
      <CommunitySubNav />

      <section className={styles.page}>
        <div className={`container ${styles.inner}`}>
          <header className={styles.pageHeader}>
            <p className={styles.eyebrow}>FANPICK COMMUNITY</p>
            <h1 className={styles.title}>COMMUNITY</h1>
          </header>

          <div className={styles.layout} ref={contentStartRef}>
            <CommunityCategoryPanel
              activeFilter={category}
              onFilterChange={changeCategory}
            />
            <CommunityPopularPanel
              className={styles.desktopPopularPanel}
              isLoading={isLoading}
              linkState={{
                communityListSearch: searchParams.toString(),
              }}
              popularPosts={popularPosts}
            />

            <main className={styles.board}>
              <div className={styles.boardHeader}>
                <h2>{selectedCategory?.label ?? "전체 게시글"}</h2>
                <div className={styles.sortButtons} aria-label="게시글 정렬">
                  <button
                    type="button"
                    className={sortBy === "latest" ? styles.activeSort : ""}
                    onClick={() => changeSort("latest")}
                  >
                    최신순
                  </button>
                  <button
                    type="button"
                    className={sortBy === "popular" ? styles.activeSort : ""}
                    onClick={() => changeSort("popular")}
                  >
                    인기순
                  </button>
                  <button
                    type="button"
                    className={sortBy === "support" ? styles.activeSort : ""}
                    onClick={() => changeSort("support")}
                  >
                    응원순
                  </button>
                </div>
              </div>

              {isLoading && (
                <>
                  <CommunityTableSkeleton />
                  <CommunityPaginationSkeleton />
                </>
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
                    <div
                      className={[
                        styles.postRow,
                        styles.tableHeader,
                        category === "my-comments" ? styles.threeColumnRow : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span>
                        {category === "my-comments" ? "댓글 / 게시글" : "제목"}
                      </span>
                      <span>
                        {category === "my-comments" ? "종목" : "작성자"}
                      </span>
                      <span>작성일</span>
                      {category !== "my-comments" && <span>조회수</span>}
                      {category !== "my-comments" && <span>응원</span>}
                    </div>
                    {visiblePosts.map((post) => (
                      <Link
                        to={`/community/${post.destinationId ?? post.id}`}
                        state={{
                          communityListSearch: searchParams.toString(),
                        }}
                        className={[
                          styles.postRow,
                          post.isMyComment ? styles.threeColumnRow : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        key={post.id}
                      >
                        {post.isMyComment ? (
                          <span className={styles.myCommentContent}>
                            <strong>{post.title}</strong>
                            <span>{post.postTitle}</span>
                          </span>
                        ) : (
                          <span className={styles.postTitle}>
                            {!CATEGORIES.some(
                              (item) =>
                                item.id !== "all" && item.id === category,
                            ) && (
                              <small className={styles.postCategory}>
                                {CATEGORY_LABELS[post.category]}
                              </small>
                            )}
                            {formatPostTitle(post.title)}
                            <b>({post.commentCount})</b>
                          </span>
                        )}
                        <span title={post.author_name}>
                          {post.isMyComment
                            ? CATEGORY_LABELS[post.category]
                            : formatAuthorName(post.author_name)}
                        </span>
                        <span>
                          {formatRelativeTime(post.created_at, currentTime)}
                        </span>
                        {!post.isMyComment && (
                          <span>{post.view_count.toLocaleString()}</span>
                        )}
                        {!post.isMyComment && (
                          <span>{post.supportCount.toLocaleString()}</span>
                        )}
                      </Link>
                    ))}
                  </div>

                  <div className={styles.pagination} aria-label="페이지 이동">
                    <button
                      type="button"
                      onClick={() => changePage(1)}
                      disabled={isFirstPage}
                      aria-label="첫 페이지"
                    >
                      <FiChevronsLeft aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => changePage(activePage - 1)}
                      disabled={isFirstPage}
                      aria-label="이전 페이지"
                    >
                      <FiChevronLeft aria-hidden="true" />
                    </button>
                    {visiblePageNumbers.map((pageNumber) => (
                      <button
                        type="button"
                        key={pageNumber}
                        className={
                          activePage === pageNumber ? styles.activePage : ""
                        }
                        onClick={() => changePage(pageNumber)}
                        aria-current={
                          activePage === pageNumber ? "page" : undefined
                        }
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => changePage(activePage + 1)}
                      disabled={isLastPage}
                      aria-label="다음 페이지"
                    >
                      <FiChevronRight aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => changePage(pageCount)}
                      disabled={isLastPage}
                      aria-label="마지막 페이지"
                    >
                      <FiChevronsRight aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </main>
          </div>
        </div>
      </section>
    </>
  );
};

export default CommunityPage;
