import { useCallback, useEffect, useRef, useState } from "react";
import { FiEye } from "react-icons/fi";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import Button from "../../../components/Button/Button";
import EmptyState from "../../../components/EmptyState/EmptyState";
import FanPickDialog from "../../../components/FanPickDialog/FanPickDialog";
import LinkifiedText from "../../../components/LinkifiedText/LinkifiedText";
import useAuth from "../../../contexts/useAuth";
import useFanPickDialog from "../../../hooks/useFanPickDialog";
import useRelativeTimeClock from "../../../hooks/useRelativeTimeClock";
import {
  createCommunityComment,
  deleteCommunityComment,
  deleteCommunityPost,
  fetchCommunityCommentReactions,
  fetchCommunityComments,
  fetchCommunityPost,
  fetchCommunityPostReactions,
  fetchCommunityPosts,
  fetchCommunityPredictionStats,
  increaseCommunityPostView,
  softDeleteCommunityComment,
  toggleCommunityCommentReaction,
  toggleCommunityPostReaction,
  updateCommunityComment,
} from "../../../services/communityApi";
import { subscribeToCommunityChanges } from "../../../services/communityRealtime";
import { formatRelativeTime } from "../../../utils/formatRelativeTime";
import CommunitySidebars from "../components/CommunitySidebars/CommunitySidebars";
import {
  CATEGORY_LABELS,
  CATEGORY_SPORT,
  EMPTY_REACTION,
  countComments,
  normalizeComments,
  normalizePost,
  submitFormOnEnter,
  updateReactionSummary,
} from "./communityDetailUtils";
import CommunityCommentItem, {
  PredictionBadge,
  ProfileAvatar,
  ReactionButtons,
} from "./components/CommunityCommentItem";
import CommunityDetailSkeleton from "./components/CommunityDetailSkeleton";
import styles from "./CommunityDetailPage.module.css";

const CommunityDetailPage = () => {
  const { postId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const userId = user?.id;

  const [comment, setComment] = useState("");
  const [post, setPost] = useState(null);
  const [previousPost, setPreviousPost] = useState(null);
  const [nextPost, setNextPost] = useState(null);
  const [popularPosts, setPopularPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentSort, setCommentSort] = useState("created");
  const [postReaction, setPostReaction] = useState(EMPTY_REACTION);
  const [commentReactions, setCommentReactions] = useState({});
  const [pendingReactionKey, setPendingReactionKey] = useState("");
  const [sportStats, setSportStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [reply, setReply] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const { dialogProps: noticeDialogProps, showDialog } = useFanPickDialog({
    lockBodyScroll: false,
  });

  const currentTime = useRelativeTimeClock();
  const increasedPostIdRef = useRef(null);

  const currentAvatarUrl = user?.user_metadata?.avatar_url || "";

  const communityListSearch = location.state?.communityListSearch;

  const communityListPath = communityListSearch
    ? `/community?${communityListSearch}`
    : "/community";

  const communityListState = communityListSearch
    ? { communityListSearch }
    : undefined;

  const sortedComments = [...comments].sort((a, b) => {
    if (commentSort === "support") {
      const supportDifference =
        (commentReactions[b.id]?.likeCount ?? 0) -
        (commentReactions[a.id]?.likeCount ?? 0);

      if (supportDifference !== 0) {
        return supportDifference;
      }
    }

    return new Date(a.createdAt) - new Date(b.createdAt);
  });
  const commentCount = countComments(comments);

  const loadDetail = useCallback(
    async ({ showLoading = true } = {}) => {
      const shouldIncreaseView = increasedPostIdRef.current !== String(postId);

      if (shouldIncreaseView) {
        increasedPostIdRef.current = String(postId);
      }

      try {
        if (showLoading) {
          setIsLoading(true);
        }

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

        const normalizedPost = normalizePost(postData);

        setPost(normalizedPost);
        setPreviousPost(normalizedPosts[currentIndex - 1] ?? null);
        setNextPost(normalizedPosts[currentIndex + 1] ?? null);

        setPopularPosts(
          [...normalizedPosts].sort((a, b) => b.views - a.views).slice(0, 10),
        );

        setComments(normalizeComments(commentRows));

        try {
          const [postReactionRows, commentReactionRows] = await Promise.all([
            fetchCommunityPostReactions([postId], userId),
            fetchCommunityCommentReactions(
              commentRows.map((item) => item.id),
              userId,
            ),
          ]);

          setPostReaction(postReactionRows[postId] ?? EMPTY_REACTION);
          setCommentReactions(commentReactionRows);
        } catch (reactionError) {
          console.error("커뮤니티 반응 조회 오류:", reactionError);

          setPostReaction(EMPTY_REACTION);
          setCommentReactions({});
        }

        try {
          const authorIds = [
            postData.user_id,
            userId,
            ...commentRows.map((item) => item.user_id),
          ];

          setSportStats(await fetchCommunityPredictionStats(authorIds));
        } catch (badgeError) {
          console.error("커뮤니티 배지 조회 오류:", badgeError);
          setSportStats([]);
        }

        if (shouldIncreaseView) {
          try {
            const increasedViewCount = await increaseCommunityPostView(postId);

            setPost((currentPost) => ({
              ...currentPost,
              views: increasedViewCount ?? normalizedPost.views + 1,
            }));
          } catch (viewError) {
            console.error("게시글 조회수 증가 오류:", viewError);
          }
        }
      } catch (error) {
        console.error("커뮤니티 상세 조회 오류:", error);
        setErrorMessage("게시글을 불러오지 못했습니다.");
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [postId, userId],
  );

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadDetail();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [loadDetail]);

  useEffect(() => {
    const unsubscribe = subscribeToCommunityChanges({
      channelName: `community-detail-${postId}`,
      postId,
      onChange: () =>
        loadDetail({
          showLoading: false,
        }),
    });

    return unsubscribe;
  }, [loadDetail, postId]);

  const requireLogin = () => {
    if (user) return true;

    setIsLoginDialogOpen(true);

    return false;
  };

  const showErrorDialog = (description) => {
    showDialog({
      description,
      title: "요청 실패",
    });
  };

  const handlePostReaction = async (reaction) => {
    if (!requireLogin() || pendingReactionKey) return;

    try {
      setPendingReactionKey("post");

      const nextReaction = await toggleCommunityPostReaction({
        postId,
        userId,
        reaction,
      });

      setPostReaction((current) =>
        updateReactionSummary(current, nextReaction),
      );
    } catch (error) {
      console.error("게시글 반응 저장 오류:", error);
      showErrorDialog("게시글 반응을 저장하지 못했습니다.");
    } finally {
      setPendingReactionKey("");
    }
  };

  const handleCommentReaction = async (commentId, reaction) => {
    const reactionKey = `comment-${commentId}`;

    if (!requireLogin() || pendingReactionKey) return;

    try {
      setPendingReactionKey(reactionKey);

      const nextReaction = await toggleCommunityCommentReaction({
        commentId,
        userId,
        reaction,
      });

      setCommentReactions((current) => ({
        ...current,
        [commentId]: updateReactionSummary(current[commentId], nextReaction),
      }));
    } catch (error) {
      console.error("댓글 반응 저장 오류:", error);
      showErrorDialog("댓글 반응을 저장하지 못했습니다.");
    } finally {
      setPendingReactionKey("");
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();

    if (!user || !comment.trim()) return;

    try {
      await createCommunityComment({
        user,
        postId: Number(postId),
        content: comment.trim(),
      });

      setComment("");
      await loadDetail({
        showLoading: false,
      });
    } catch (error) {
      console.error("댓글 저장 오류:", error);
      showErrorDialog("댓글을 저장하지 못했습니다.");
    }
  };

  const submitReply = async (event, parentComment) => {
    event.preventDefault();

    if (!user || !reply.trim()) return;

    try {
      await createCommunityComment({
        user,
        postId: Number(postId),
        parentId: parentComment.id,
        content: reply.trim(),
      });

      setReply("");
      setReplyingTo(null);
      await loadDetail({
        showLoading: false,
      });
    } catch (error) {
      console.error("답글 저장 오류:", error);
      showErrorDialog("답글을 저장하지 못했습니다.");
    }
  };

  const startEdit = (commentItem) => {
    setEditingItem(`comment-${commentItem.id}`);
    setEditedContent(commentItem.content);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditedContent("");
  };

  const saveComment = async (commentId) => {
    if (!editedContent.trim()) return;

    try {
      await updateCommunityComment(commentId, editedContent.trim());

      await loadDetail({
        showLoading: false,
      });
      cancelEdit();
    } catch (error) {
      console.error("댓글 수정 오류:", error);
      showErrorDialog("댓글을 수정하지 못했습니다.");
    }
  };

  const deleteComment = (commentItem) => {
    setDeleteTarget({
      type: "comment",
      commentId: commentItem.id,
      hasReplies: (commentItem.replies ?? []).length > 0,
      name: commentItem.parentId ? "답글" : "댓글",
      parentId: commentItem.parentId,
    });
  };

  const handleDeletePost = () => {
    setDeleteTarget({
      type: "post",
      name: "게시글",
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "post") {
        await deleteCommunityPost(postId);

        navigate("/community", {
          replace: true,
        });

        return;
      }

      if (deleteTarget.type === "comment") {
        if (!deleteTarget.parentId || deleteTarget.hasReplies) {
          await softDeleteCommunityComment(deleteTarget.commentId);
        } else {
          await deleteCommunityComment(deleteTarget.commentId);
        }

        await loadDetail({
          showLoading: false,
        });
      }

      setDeleteTarget(null);
    } catch (error) {
      console.error(`${deleteTarget.name} 삭제 오류:`, error);
      showErrorDialog(`${deleteTarget.name}을 삭제하지 못했습니다.`);
    }
  };

  if (isLoading) {
    return <CommunityDetailSkeleton />;
  }

  if (errorMessage || !post) {
    return <EmptyState title={errorMessage || "게시글이 없습니다."} />;
  }

  return (
    <section className={styles.page}>
      <div className={`container ${styles.layout}`}>
        <CommunitySidebars
          popularLinkState={communityListState}
          popularPosts={popularPosts}
        />

        <main className={styles.mainArea}>
          <div className={styles.pageControls}>
            <Button size="sm" to={communityListPath} variant="secondary">
              목록
            </Button>

            <div>
              {previousPost && (
                <Button
                  size="sm"
                  to={`/community/${previousPost.id}`}
                  state={communityListState}
                  variant="secondary"
                >
                  이전글
                </Button>
              )}

              {nextPost && (
                <Button
                  size="sm"
                  to={`/community/${nextPost.id}`}
                  state={communityListState}
                  variant="secondary"
                >
                  다음글
                </Button>
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
                  name={post.author}
                />

                <div>
                  <span className={styles.nicknameWithBadge}>
                    <b>{post.author}</b>

                    <PredictionBadge
                      userId={post.user_id}
                      fallbackSport={CATEGORY_SPORT[post.category]}
                      sportStats={sportStats}
                    />
                  </span>

                  <span className={styles.authorMeta}>
                    <small>
                      {formatRelativeTime(post.createdAt, currentTime)}
                    </small>

                    <span className={styles.metaDivider} aria-hidden="true">
                      ·
                    </span>

                    <span
                      className={styles.viewCount}
                      aria-label={`조회수 ${post.views}`}
                    >
                      <FiEye aria-hidden="true" />
                      {post.views}
                    </span>

                    {post.user_id === userId && (
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
              <p>
                <LinkifiedText text={post.content} />
              </p>

              {post.images.length > 0 && (
                <div className={styles.postImageGrid}>
                  {post.images.map((image, index) => (
                    <div className={styles.postImageArea} key={image.id}>
                      <img
                        className={styles.postImage}
                        src={image.url}
                        alt={`${post.title} 첨부 이미지 ${index + 1}`}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.postReactionArea}>
                <ReactionButtons
                  disabled={pendingReactionKey === "post"}
                  summary={postReaction}
                  onReact={handlePostReaction}
                />
              </div>
            </div>

            <section className={styles.commentSection}>
              <div className={styles.commentHeader}>
                <h2>댓글 {commentCount}</h2>

                <div className={styles.commentSort}>
                  <button
                    type="button"
                    className={
                      commentSort === "created" ? styles.activeSort : ""
                    }
                    onClick={() => setCommentSort("created")}
                  >
                    등록순
                  </button>

                  <button
                    type="button"
                    className={
                      commentSort === "support" ? styles.activeSort : ""
                    }
                    onClick={() => setCommentSort("support")}
                  >
                    응원순
                  </button>
                </div>
              </div>

              <form className={styles.commentForm} onSubmit={submitComment}>
                <ProfileAvatar
                  avatarUrl={currentAvatarUrl}
                  className={styles.smallAvatar}
                  name={user?.user_metadata?.nickname}
                />

                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  onKeyDown={submitFormOnEnter}
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
                {sortedComments.map((item) => (
                  <CommunityCommentItem
                    commentItem={item}
                    commentReactions={commentReactions}
                    currentTime={currentTime}
                    editedContent={editedContent}
                    editingItem={editingItem}
                    key={item.id}
                    onCancelEdit={cancelEdit}
                    onChangeEditedContent={setEditedContent}
                    onDelete={deleteComment}
                    onReact={handleCommentReaction}
                    onReplyChange={setReply}
                    onReplySubmit={submitReply}
                    onReplyToggle={(commentItem) => {
                      setReplyingTo(
                        replyingTo === commentItem.id ? null : commentItem.id,
                      );
                      setReply("");
                    }}
                    onSaveEdit={saveComment}
                    onStartEdit={startEdit}
                    pendingReactionKey={pendingReactionKey}
                    postCategory={post.category}
                    reply={reply}
                    replyingTo={replyingTo}
                    sportStats={sportStats}
                    user={user}
                    userId={userId}
                  />
                ))}
              </ul>
            </section>
          </article>
        </main>
      </div>

      <FanPickDialog
        isOpen={Boolean(deleteTarget)}
        title={`${deleteTarget?.name ?? ""}을 삭제하시겠습니까?`}
        description="삭제한 내용은 다시 복구할 수 없습니다."
        cancelText="취소"
        confirmText="삭제"
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        lockBodyScroll={false}
      />

      <FanPickDialog
        isOpen={isLoginDialogOpen}
        title="로그인이 필요합니다"
        description="응원 또는 반대를 선택하려면 로그인해 주세요."
        cancelText="취소"
        confirmText="로그인하기"
        onClose={() => setIsLoginDialogOpen(false)}
        onConfirm={() => {
          setIsLoginDialogOpen(false);

          navigate("/login", {
            state: {
              from: location,
            },
          });
        }}
        lockBodyScroll={false}
      />

      <FanPickDialog {...noticeDialogProps} />
    </section>
  );
};

export default CommunityDetailPage;
