import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EmptyState from "../../../components/EmptyState/EmptyState";
import FanPickDialog from "../../../components/FanPickDialog/FanPickDialog";
import useAuth from "../../../contexts/useAuth";
import {
  createSettledPredictionSportStats,
  fetchMyPredictions,
} from "../../../services/predictionApi";
import {
  createCommunityComment,
  deleteCommunityComment,
  deleteCommunityPost,
  fetchCommunityComments,
  fetchCommunityPost,
  fetchCommunityPosts,
  increaseCommunityPostView,
  updateCommunityComment,
} from "../../../services/communityApi";
import { getPredictionBadgeMeta } from "../../../utils/predictionBadge";
import { CATEGORIES } from "../CommunityPage";
import styles from "./CommunityDetailPage.module.css";

const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category.label]),
);

const CATEGORY_SPORT = {
  lck: "esports",
  baseball: "baseball",
  soccer: "soccer",
};

const PredictionBadge = ({
  userId,
  currentUserId,
  fallbackSport,
  sportStats,
}) => {
  if (!userId || userId !== currentUserId) return null;

  const stats = sportStats.find((item) => item.sport === fallbackSport);
  const totalCount = Number(stats?.total_count ?? 0);
  const accuracyRate = Number(stats?.accuracy_rate ?? 0);
  const badge = getPredictionBadgeMeta(
    fallbackSport,
    totalCount,
    accuracyRate,
  );

  return <span className={styles.predictionBadge}>{badge.name}</span>;
};

const formatDate = (date) => {
  const value = new Date(date);
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${month}.${day}`;
};

const formatCommentTime = (date, updatedAt) => {
  const formatted = new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(updatedAt || date));

  return updatedAt !== date ? `${formatted} · 수정됨` : formatted;
};

const normalizePost = (post) => ({
  ...post,
  author: post.author_name,
  avatarUrl: post.author_avatar_url,
  date: formatDate(post.created_at),
  views: Number(post.view_count ?? 0),
});

const normalizeComments = (rows) => {
  const normalize = (row) => ({
    id: row.id,
    userId: row.user_id,
    author: row.author_name,
    avatarUrl: row.author_avatar_url,
    content: row.content,
    time: formatCommentTime(row.created_at, row.updated_at),
    replies: [],
  });
  const roots = rows.filter((row) => !row.parent_id).map(normalize);
  const rootMap = new Map(roots.map((comment) => [comment.id, comment]));

  rows.filter((row) => row.parent_id).forEach((row) => {
    rootMap.get(row.parent_id)?.replies.push(normalize(row));
  });
  return roots;
};

const ProfileAvatar = ({ avatarUrl, className }) =>
  avatarUrl ? (
    <img className={className} src={avatarUrl} alt="프로필" />
  ) : (
    <span className={className} aria-hidden="true" />
  );

const CommunityDetailPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [post, setPost] = useState(null);
  const [previousPost, setPreviousPost] = useState(null);
  const [nextPost, setNextPost] = useState(null);
  const [popularPosts, setPopularPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [sportStats, setSportStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [reply, setReply] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const currentAvatarUrl = user?.user_metadata?.avatar_url || "";

  useEffect(() => {
    if (!user) return;

    const loadMyBadgeStats = async () => {
      try {
        const predictions = await fetchMyPredictions(user.id);
        setSportStats(
          createSettledPredictionSportStats(predictions, [
            "soccer",
            "baseball",
            "esports",
          ]),
        );
      } catch (error) {
        console.error("커뮤니티 배지 조회 오류:", error);
        setSportStats([]);
      }
    };

    loadMyBadgeStats();
  }, [user]);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const [postData, postList, commentRows] = await Promise.all([
          fetchCommunityPost(postId),
          fetchCommunityPosts(),
          fetchCommunityComments(postId),
        ]);
        const normalizedPosts = postList.map(normalizePost);
        const currentIndex = normalizedPosts.findIndex(
          (item) => String(item.id) === String(postId),
        );

        setPost(normalizePost(postData));
        setPreviousPost(normalizedPosts[currentIndex - 1] ?? null);
        setNextPost(normalizedPosts[currentIndex + 1] ?? null);
        setPopularPosts(
          [...normalizedPosts].sort((a, b) => b.views - a.views).slice(0, 10),
        );
        setComments(normalizeComments(commentRows));
        increaseCommunityPostView(postId).catch((error) =>
          console.warn("조회수 증가 함수 오류:", error.message),
        );
      } catch (error) {
        console.error("커뮤니티 상세 조회 오류:", error);
        setErrorMessage("게시글을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDetail();
  }, [postId]);

  const submitComment = async (event) => {
    event.preventDefault();
    if (!user || !comment.trim()) return;

    try {
      const savedComment = await createCommunityComment({
        user,
        postId: Number(postId),
        content: comment.trim(),
      });
      setComments((currentComments) => [
        ...currentComments,
        ...normalizeComments([savedComment]),
      ]);
      setComment("");
    } catch (error) {
      console.error("댓글 저장 오류:", error);
      alert("댓글을 저장하지 못했습니다.");
    }
  };

  const submitReply = async (event, commentId) => {
    event.preventDefault();
    if (!user || !reply.trim()) return;

    try {
      const savedReply = await createCommunityComment({
        user,
        postId: Number(postId),
        parentId: commentId,
        content: reply.trim(),
      });
      const normalizedReply = normalizeComments([
        { ...savedReply, parent_id: null },
      ])[0];
      setComments((currentComments) =>
        currentComments.map((item) =>
          item.id === commentId
            ? { ...item, replies: [...item.replies, normalizedReply] }
            : item,
        ),
      );
      setReply("");
      setReplyingTo(null);
    } catch (error) {
      console.error("답글 저장 오류:", error);
      alert("답글을 저장하지 못했습니다.");
    }
  };

  const startEdit = (itemKey, content) => {
    setEditingItem(itemKey);
    setEditedContent(content);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditedContent("");
  };

  const saveComment = async (commentId) => {
    if (!editedContent.trim()) return;

    try {
      await updateCommunityComment(commentId, editedContent.trim());
      setComments((currentComments) =>
        currentComments.map((item) =>
          item.id === commentId
            ? { ...item, content: editedContent.trim(), time: "방금 전 · 수정됨" }
            : item,
        ),
      );
      cancelEdit();
    } catch (error) {
      console.error("댓글 수정 오류:", error);
      alert("댓글을 수정하지 못했습니다.");
    }
  };

  const deleteComment = (commentId) => {
    setDeleteTarget({ type: "comment", commentId, name: "댓글" });
  };

  const saveReply = async (commentId, replyId) => {
    if (!editedContent.trim()) return;

    try {
      await updateCommunityComment(replyId, editedContent.trim());
      setComments((currentComments) =>
        currentComments.map((item) =>
          item.id === commentId
            ? {
                ...item,
                replies: item.replies.map((replyItem) =>
                  replyItem.id === replyId
                    ? { ...replyItem, content: editedContent.trim(), time: "방금 전 · 수정됨" }
                    : replyItem,
                ),
              }
            : item,
        ),
      );
      cancelEdit();
    } catch (error) {
      console.error("답글 수정 오류:", error);
      alert("답글을 수정하지 못했습니다.");
    }
  };

  const deleteReply = (commentId, replyId) => {
    setDeleteTarget({ type: "reply", commentId, replyId, name: "답글" });
  };

  const handleDeletePost = () => {
    setDeleteTarget({ type: "post", name: "게시글" });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "post") {
        await deleteCommunityPost(postId);
        navigate("/community", { replace: true });
        return;
      }

      if (deleteTarget.type === "comment") {
        await deleteCommunityComment(deleteTarget.commentId);
        setComments((currentComments) =>
          currentComments.filter(
            (item) => item.id !== deleteTarget.commentId,
          ),
        );
      }

      if (deleteTarget.type === "reply") {
        await deleteCommunityComment(deleteTarget.replyId);
        setComments((currentComments) =>
          currentComments.map((item) =>
            item.id === deleteTarget.commentId
              ? {
                  ...item,
                  replies: item.replies.filter(
                    (replyItem) => replyItem.id !== deleteTarget.replyId,
                  ),
                }
              : item,
          ),
        );
      }

      setDeleteTarget(null);
    } catch (error) {
      console.error(`${deleteTarget.name} 삭제 오류:`, error);
      alert(`${deleteTarget.name}을 삭제하지 못했습니다.`);
    }
  };

  if (isLoading) {
    return (
      <section className={styles.page} aria-label="게시글 불러오는 중">
        <div className={`container ${styles.loadingSpace}`} />
      </section>
    );
  }

  if (errorMessage || !post) {
    return <EmptyState title={errorMessage || "게시글이 없습니다."} />;
  }

  return (
    <section className={styles.page}>
      <div className={`container ${styles.layout}`}>
        <aside className={styles.categoryPanel}>
          <Link to="/community/write" className={styles.writeButton}>
            글쓰기
          </Link>

          <nav className={styles.categoryNav} aria-label="게시판 카테고리">
            {CATEGORIES.map((category) => (
              <Link key={category.id} to="/community">
                {category.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className={styles.mainArea}>
          <div className={styles.pageControls}>
            <Link to="/community" className={styles.controlButton}>
              목록
            </Link>

            <div>
              {previousPost && (
                <Link
                  to={`/community/${previousPost.id}`}
                  className={styles.controlButton}
                >
                  이전글
                </Link>
              )}
              {nextPost && (
                <Link
                  to={`/community/${nextPost.id}`}
                  className={styles.controlButton}
                >
                  다음글
                </Link>
              )}
            </div>
          </div>

          <article className={styles.article}>
            <header className={styles.articleHeader}>
              <strong>{CATEGORY_LABELS[post.category]}</strong>
              <h1>{post.title}</h1>

              <div className={styles.authorInfo}>
                <ProfileAvatar
                  avatarUrl={post.avatarUrl}
                  className={styles.avatar}
                />
                <div>
                  <span className={styles.nicknameWithBadge}>
                    <b>{post.author}</b>
                    <PredictionBadge
                      userId={post.user_id}
                      currentUserId={user?.id}
                      fallbackSport={CATEGORY_SPORT[post.category]}
                      sportStats={sportStats}
                    />
                  </span>
                  <span className={styles.authorMeta}>
                    <small>{post.date}</small>
                    {post.user_id === user?.id && (
                      <span className={styles.postActions}>
                        <Link to={`/community/${post.id}/edit`}>수정</Link>
                        <button type="button" onClick={handleDeletePost}>
                          삭제
                        </button>
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </header>

            <div className={styles.articleContent}>
              <p>{post.content}</p>
            </div>

            <section className={styles.commentSection}>
              <h2>댓글 {comments.length}</h2>

              <form className={styles.commentForm} onSubmit={submitComment}>
                <ProfileAvatar
                  avatarUrl={currentAvatarUrl}
                  className={styles.smallAvatar}
                />
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder={
                    user
                      ? "댓글을 입력하세요"
                      : "로그인 후 댓글을 작성할 수 있어요"
                  }
                  aria-label="댓글 내용"
                  disabled={!user}
                />
                <button type="submit" disabled={!user || !comment.trim()}>
                  등록
                </button>
              </form>

              <ul className={styles.commentList}>
                {comments.map((item) => (
                  <li key={item.id}>
                    <ProfileAvatar
                      avatarUrl={item.avatarUrl}
                      className={styles.smallAvatar}
                    />
                    <div className={styles.commentBody}>
                      <span className={styles.nicknameWithBadge}>
                        <b>{item.author}</b>
                        <PredictionBadge
                          userId={item.userId}
                          currentUserId={user?.id}
                          fallbackSport={CATEGORY_SPORT[post.category]}
                          sportStats={sportStats}
                        />
                      </span>
                      {editingItem === `comment-${item.id}` ? (
                        <div className={styles.editArea}>
                          <textarea
                            value={editedContent}
                            onChange={(event) =>
                              setEditedContent(event.target.value)
                            }
                            aria-label="댓글 수정 내용"
                            autoFocus
                          />
                          <div>
                            <button type="button" onClick={cancelEdit}>
                              취소
                            </button>
                            <button
                              type="button"
                              disabled={!editedContent.trim()}
                              onClick={() => saveComment(item.id)}
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p>{item.content}</p>
                      )}
                      <div className={styles.commentMeta}>
                        <small>{item.time}</small>
                        {user && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo(
                                replyingTo === item.id ? null : item.id,
                              );
                              setReply("");
                            }}
                          >
                            {replyingTo === item.id ? "취소" : "답글 쓰기"}
                          </button>
                        )}
                        {item.userId === user?.id && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                startEdit(`comment-${item.id}`, item.content)
                              }
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteComment(item.id)}
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>

                      {replyingTo === item.id && (
                        <form
                          className={styles.replyForm}
                          onSubmit={(event) => submitReply(event, item.id)}
                        >
                          <textarea
                            value={reply}
                            onChange={(event) => setReply(event.target.value)}
                            placeholder={`${item.author}님에게 답글 입력`}
                            aria-label="답글 내용"
                            autoFocus
                          />
                          <div className={styles.replyActions}>
                            <button
                              type="button"
                              className={styles.replyCancelButton}
                              onClick={() => {
                                setReply("");
                                setReplyingTo(null);
                              }}
                            >
                              취소
                            </button>
                            <button type="submit" disabled={!reply.trim()}>
                              등록
                            </button>
                          </div>
                        </form>
                      )}

                      {(item.replies ?? []).map((replyItem) => (
                        <div className={styles.replyItem} key={replyItem.id}>
                          <ProfileAvatar
                            avatarUrl={replyItem.avatarUrl}
                            className={styles.smallAvatar}
                          />
                          <div>
                            <span className={styles.nicknameWithBadge}>
                              <b>{replyItem.author}</b>
                              <PredictionBadge
                                userId={replyItem.userId}
                                currentUserId={user?.id}
                                fallbackSport={CATEGORY_SPORT[post.category]}
                                sportStats={sportStats}
                              />
                            </span>
                            {editingItem ===
                            `reply-${item.id}-${replyItem.id}` ? (
                              <div className={styles.editArea}>
                                <textarea
                                  value={editedContent}
                                  onChange={(event) =>
                                    setEditedContent(event.target.value)
                                  }
                                  aria-label="답글 수정 내용"
                                  autoFocus
                                />
                                <div>
                                  <button type="button" onClick={cancelEdit}>
                                    취소
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!editedContent.trim()}
                                    onClick={() =>
                                      saveReply(item.id, replyItem.id)
                                    }
                                  >
                                    저장
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p>{replyItem.content}</p>
                            )}
                            <div className={styles.commentMeta}>
                              <small>{replyItem.time}</small>
                              {replyItem.userId === user?.id && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startEdit(
                                        `reply-${item.id}-${replyItem.id}`,
                                        replyItem.content,
                                      )
                                    }
                                  >
                                    수정
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteReply(item.id, replyItem.id)
                                    }
                                  >
                                    삭제
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </article>
        </main>

        <aside className={styles.popularPanel}>
          <h2>커뮤니티 인기글</h2>
          <ul>
            {popularPosts.map((popularPost) => (
                <li key={popularPost.id}>
                  <Link to={`/community/${popularPost.id}`}>
                    <span>{popularPost.title}</span>
                    <b>({popularPost.views.toLocaleString()})</b>
                  </Link>
                </li>
              ))}
          </ul>
        </aside>
      </div>

      <FanPickDialog
        isOpen={Boolean(deleteTarget)}
        title={`${deleteTarget?.name ?? ""}을 삭제하시겠습니까?`}
        description="삭제한 내용은 다시 복구할 수 없습니다."
        cancelText="취소"
        confirmText="삭제"
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        showCloseButton={false}
        showAccentLine={false}
        lockBodyScroll={false}
      />
    </section>
  );
};

export default CommunityDetailPage;
