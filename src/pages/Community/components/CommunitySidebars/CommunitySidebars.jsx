import { Link } from "react-router-dom";
import { BOARD_FILTERS } from "../../communityConstants";
import styles from "./CommunitySidebars.module.css";

const CommunitySidebars = ({
  activeFilter,
  onFilterChange,
  popularPosts,
}) => (
  <>
    <aside className={styles.categoryPanel}>
      <Link to="/community/write" className={styles.writeButton}>
        글쓰기
      </Link>

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

    <aside className={styles.popularPanel}>
      <h2>커뮤니티 인기글</h2>
      <ul>
        {popularPosts.map((post) => (
          <li key={post.id}>
            <Link to={`/community/${post.id}`}>
              <span>{post.title}</span>
              <b>({Number(post.commentCount ?? 0).toLocaleString()})</b>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  </>
);

export default CommunitySidebars;
