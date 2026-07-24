import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../../../components/Button/Button";
import FanPickDialog from "../../../../components/FanPickDialog/FanPickDialog";
import Skeleton from "../../../../components/Skeleton/Skeleton";
import useAuth from "../../../../contexts/useAuth";
import { BOARD_FILTERS } from "../../communityConstants";
import styles from "./CommunitySidebars.module.css";

const WRITE_PATH = "/community/write";

const CommunitySidebars = ({
  activeFilter,
  isPopularLoading = false,
  onFilterChange,
  popularPosts,
}) => (
  <>
    <CommunityCategoryPanel
      activeFilter={activeFilter}
      onFilterChange={onFilterChange}
    />
    <CommunityPopularPanel
      isLoading={isPopularLoading}
      popularPosts={popularPosts}
    />
  </>
);

export const CommunityCategoryPanel = ({
  activeFilter,
  onFilterChange,
}) => {
  const navigate = useNavigate();
  const { isAuthLoading, isLoggedIn } = useAuth();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  const handleWriteClick = (event) => {
    if (isAuthLoading) {
      event.preventDefault();
      return;
    }

    if (!isLoggedIn) {
      event.preventDefault();
      setIsLoginDialogOpen(true);
    }
  };

  const closeLoginDialog = () => {
    setIsLoginDialogOpen(false);
  };

  const handleMoveToLogin = () => {
    closeLoginDialog();
    navigate("/login", {
      state: {
        from: {
          pathname: WRITE_PATH,
        },
      },
    });
  };

  return (
    <>
      <aside className={styles.categoryPanel}>
        <Button to={WRITE_PATH} fullWidth onClick={handleWriteClick}>
          글쓰기
        </Button>

        <nav className={styles.categoryNav} aria-label="게시판 카테고리">
          {BOARD_FILTERS.map((item, index) =>
            onFilterChange ? (
              <button
                type="button"
                key={item.id}
                className={[
                  activeFilter === item.id ? styles.activeCategory : "",
                  index === 4 ? styles.categoryStart : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onFilterChange(item.id)}
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.id}
                to={
                  item.id === "all"
                    ? "/community"
                    : `/community?filter=${item.id}`
                }
                className={index === 4 ? styles.categoryStart : ""}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </aside>

      <FanPickDialog
        isOpen={isLoginDialogOpen}
        title="로그인이 필요합니다"
        description="글을 작성하려면 먼저 로그인해 주세요."
        confirmText="로그인하기"
        cancelText="취소"
        onClose={closeLoginDialog}
        onConfirm={handleMoveToLogin}
      />
    </>
  );
};

export const CommunityPopularPanel = ({
  className = "",
  isLoading = false,
  popularPosts = [],
}) => (
  <aside className={[styles.popularPanel, className].filter(Boolean).join(" ")}>
    <h2>커뮤니티 인기글</h2>
    <ul>
      {isLoading
        ? Array.from({ length: 10 }, (_, index) => (
            <li className={styles.popularSkeletonItem} key={index}>
              <Skeleton.Line className={styles.popularSkeletonLine} />
            </li>
          ))
        : popularPosts.map((post) => (
            <li key={post.id}>
              <Link to={`/community/${post.id}`}>
                <span>{post.title}</span>
                <b>({Number(post.commentCount ?? 0).toLocaleString()})</b>
              </Link>
            </li>
          ))}
    </ul>
  </aside>
);

export default CommunitySidebars;
