import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import useAuth from "../../../contexts/useAuth";
import {
  CATEGORIES,
  MOCK_POSTS,
} from "../Board/CommunityBoard";
import styles from "./CommunityDetailPage.module.css";

const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category.label]),
);

const MOCK_COMMENTS = [
  {
    id: 1,
    author: "학삼공인 팬",
    content: "안녕하세요!",
    time: "2시간 전",
    replies: [
      {
        id: 11,
        author: "하루살이",
        content: "반갑습니다!",
        time: "1시간 전",
      },
    ],
  },
  {
    id: 2,
    author: "하루살이",
    content: "저도 같은 생각이에요.",
    time: "1시간 전",
    replies: [],
  },
  {
    id: 3,
    author: "직관러",
    content: "다음 경기는 꼭 보고 싶네요.",
    time: "24분 전",
    replies: [],
  },
];

const ProfileAvatar = ({ avatarUrl, className }) =>
  avatarUrl ? (
    <img className={className} src={avatarUrl} alt="프로필" />
  ) : (
    <span className={className} aria-hidden="true" />
  );

const CommunityDetailPage = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [replyingTo, setReplyingTo] = useState(null);
  const [reply, setReply] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [editedContent, setEditedContent] = useState("");

  const postIndex = MOCK_POSTS.findIndex((post) => post.id === Number(postId));
  const post = MOCK_POSTS[postIndex] ?? MOCK_POSTS[0];
  const previousPost = MOCK_POSTS[postIndex - 1];
  const nextPost = MOCK_POSTS[postIndex + 1];
  const currentNickname = user?.user_metadata?.nickname || "FanPick 사용자";
  const currentAvatarUrl = user?.user_metadata?.avatar_url || "";

  const submitComment = (event) => {
    event.preventDefault();
    if (!user || !comment.trim()) return;

    setComments((currentComments) => [
      ...currentComments,
      {
        id: Date.now(),
        userId: user.id,
        author: currentNickname,
        avatarUrl: currentAvatarUrl,
        content: comment.trim(),
        time: "방금 전",
        replies: [],
      },
    ]);
    setComment("");
  };

  const submitReply = (event, commentId) => {
    event.preventDefault();
    if (!user || !reply.trim()) return;

    setComments((currentComments) =>
      currentComments.map((item) =>
        item.id === commentId
          ? {
              ...item,
              replies: [
                ...(item.replies ?? []),
                {
                  id: Date.now(),
                  userId: user.id,
                  author: currentNickname,
                  avatarUrl: currentAvatarUrl,
                  content: reply.trim(),
                  time: "방금 전",
                },
              ],
            }
          : item,
      ),
    );

    setReply("");
    setReplyingTo(null);
  };

  const startEdit = (itemKey, content) => {
    setEditingItem(itemKey);
    setEditedContent(content);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditedContent("");
  };

  const saveComment = (commentId) => {
    if (!editedContent.trim()) return;

    setComments((currentComments) =>
      currentComments.map((item) =>
        item.id === commentId
          ? { ...item, content: editedContent.trim(), time: "방금 전 · 수정됨" }
          : item,
      ),
    );
    cancelEdit();
  };

  const deleteComment = (commentId) => {
    if (!window.confirm("댓글을 삭제할까요?")) return;

    setComments((currentComments) =>
      currentComments.filter((item) => item.id !== commentId),
    );
  };

  const saveReply = (commentId, replyId) => {
    if (!editedContent.trim()) return;

    setComments((currentComments) =>
      currentComments.map((item) =>
        item.id === commentId
          ? {
              ...item,
              replies: (item.replies ?? []).map((replyItem) =>
                replyItem.id === replyId
                  ? {
                      ...replyItem,
                      content: editedContent.trim(),
                      time: "방금 전 · 수정됨",
                    }
                  : replyItem,
              ),
            }
          : item,
      ),
    );
    cancelEdit();
  };

  const deleteReply = (commentId, replyId) => {
    if (!window.confirm("답글을 삭제할까요?")) return;

    setComments((currentComments) =>
      currentComments.map((item) =>
        item.id === commentId
          ? {
              ...item,
              replies: (item.replies ?? []).filter(
                (replyItem) => replyItem.id !== replyId,
              ),
            }
          : item,
      ),
    );
  };

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
                <span className={styles.avatar} aria-hidden="true" />
                <div>
                  <b>{post.author}</b>
                  <small>{post.date}</small>
                </div>
              </div>
            </header>

            <div className={styles.articleContent}>
              <p>{post.title}</p>
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
                    user ? "댓글을 입력하세요" : "로그인 후 댓글을 작성할 수 있어요"
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
                      <b>{item.author}</b>
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
                            <b>{replyItem.author}</b>
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
            {MOCK_POSTS.slice()
              .sort((a, b) => b.views - a.views)
              .slice(0, 3)
              .map((popularPost) => (
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
    </section>
  );
};

export default CommunityDetailPage;
