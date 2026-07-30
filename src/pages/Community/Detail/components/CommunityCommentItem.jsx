import { FiThumbsDown, FiThumbsUp } from "react-icons/fi";
import LinkifiedText from "../../../../components/LinkifiedText/LinkifiedText";
import { getPredictionBadgeMeta } from "../../../../utils/predictionBadge";
import {
  CATEGORY_SPORT,
  EMPTY_REACTION,
  PREDICTION_SPORTS,
  flattenReplies,
  formatCommentTime,
  submitFormOnEnter,
} from "../communityDetailUtils";
import styles from "../CommunityDetailPage.module.css";

export const PredictionBadge = ({
  userId,
  fallbackSport = "overall",
  sportStats = [],
}) => {
  if (!userId) return null;

  const userStats = sportStats.filter((item) => item.user_id === userId);

  let totalCount;
  let accuracyRate;

  if (fallbackSport === "overall") {
    const explicitOverallStats = userStats.find(
      (item) => item.sport === "overall",
    );

    if (explicitOverallStats) {
      totalCount = Number(explicitOverallStats.total_count ?? 0);
      accuracyRate = Number(explicitOverallStats.accuracy_rate ?? 0);
    } else {
      const sportSummaries = userStats.filter((item) =>
        PREDICTION_SPORTS.includes(item.sport),
      );

      totalCount = sportSummaries.reduce(
        (sum, item) => sum + Number(item.total_count ?? 0),
        0,
      );

      const correctCount = sportSummaries.reduce((sum, item) => {
        if (item.correct_count !== null && item.correct_count !== undefined) {
          return sum + Number(item.correct_count);
        }

        const itemTotalCount = Number(item.total_count ?? 0);
        const itemAccuracyRate = Number(item.accuracy_rate ?? 0);

        return sum + itemTotalCount * (itemAccuracyRate / 100);
      }, 0);

      accuracyRate =
        totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    }
  } else {
    const stats = userStats.find((item) => item.sport === fallbackSport);

    totalCount = Number(stats?.total_count ?? 0);
    accuracyRate = Number(stats?.accuracy_rate ?? 0);
  }

  const badge = getPredictionBadgeMeta(fallbackSport, totalCount, accuracyRate);

  return <span className={styles.predictionBadge}>{badge.name}</span>;
};

export const ProfileAvatar = ({ avatarUrl, className, name }) => {
  const profileName = String(name || "FanPick");

  return avatarUrl ? (
    <img className={className} src={avatarUrl} alt={`${profileName} 프로필`} />
  ) : (
    <span className={className} aria-hidden="true">
      {profileName.trim().charAt(0).toUpperCase() || "F"}
    </span>
  );
};

export const ReactionButtons = ({
  disabled,
  onReact,
  summary = EMPTY_REACTION,
}) => (
  <div className={styles.reactionButtons}>
    <span className={styles.reactionOption}>
      <button
        type="button"
        className={[
          styles.supportButton,
          summary.myReaction === "like" ? styles.activeReaction : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-pressed={summary.myReaction === "like"}
        disabled={disabled}
        onClick={() => onReact("like")}
      >
        <span>응원</span>
        <FiThumbsUp aria-hidden="true" />
      </button>

      <b className={styles.reactionCount}>{summary.likeCount}</b>
    </span>

    <span className={styles.reactionOption}>
      <button
        type="button"
        className={[
          styles.opposeButton,
          summary.myReaction === "dislike" ? styles.activeReaction : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-pressed={summary.myReaction === "dislike"}
        disabled={disabled}
        onClick={() => onReact("dislike")}
      >
        <span>반대</span>
        <FiThumbsDown aria-hidden="true" />
      </button>

      <b className={styles.reactionCount}>{summary.dislikeCount}</b>
    </span>
  </div>
);

const CommunityCommentItem = ({
  commentItem,
  commentReactions,
  currentTime,
  editedContent,
  editingItem,
  isReply = false,
  rootCommentId = null,
  onCancelEdit,
  onChangeEditedContent,
  onDelete,
  onReact,
  onReplyChange,
  onReplySubmit,
  onReplyToggle,
  onSaveEdit,
  onStartEdit,
  pendingReactionKey,
  postCategory,
  renderReplies = true,
  reply,
  replyingTo,
  sportStats,
  user,
  userId,
}) => {
  const isEditing = editingItem === `comment-${commentItem.id}`;
  const isReplying = replyingTo === commentItem.id;
  const replies = commentItem.replies ?? [];
  const visibleReplies = renderReplies ? flattenReplies(replies) : [];
  const showReplyTarget = isReply && commentItem.parentId !== rootCommentId;
  const replyTargetLabel =
    commentItem.parentAuthor === "삭제된 댓글"
      ? "삭제된 댓글에 답글"
      : `${commentItem.parentAuthor || "댓글"}님에게 답글`;

  return (
    <li
      className={[styles.commentItem, isReply ? styles.replyItem : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {!commentItem.isDeleted && (
        <ProfileAvatar
          avatarUrl={commentItem.avatarUrl}
          className={styles.smallAvatar}
          name={commentItem.author}
        />
      )}

      <div className={styles.commentBody}>
        {!commentItem.isDeleted && (
          <span className={styles.nicknameWithBadge}>
            <b>{commentItem.author}</b>

            <PredictionBadge
              userId={commentItem.userId}
              fallbackSport={CATEGORY_SPORT[postCategory]}
              sportStats={sportStats}
            />
          </span>
        )}

        {!commentItem.isDeleted && showReplyTarget && (
          <span className={styles.replyTarget}>{replyTargetLabel}</span>
        )}

        {commentItem.isDeleted ? (
          <p className={styles.deletedComment}>삭제된 댓글입니다.</p>
        ) : isEditing ? (
          <div className={styles.editArea}>
            <textarea
              value={editedContent}
              onChange={(event) => onChangeEditedContent(event.target.value)}
              aria-label={isReply ? "답글 수정 내용" : "댓글 수정 내용"}
              autoFocus
            />

            <div>
              <button type="button" onClick={onCancelEdit}>
                취소
              </button>

              <button
                type="button"
                disabled={!editedContent.trim()}
                onClick={() => onSaveEdit(commentItem.id)}
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <p>
            <LinkifiedText text={commentItem.content} />
          </p>
        )}

        {!commentItem.isDeleted && (
          <div className={styles.commentMeta}>
            <small>
              {formatCommentTime(
                commentItem.createdAt,
                commentItem.updatedAt,
                currentTime,
              )}
            </small>

            {user && (
              <button type="button" onClick={() => onReplyToggle(commentItem)}>
                {isReplying ? "취소" : "답글 쓰기"}
              </button>
            )}

            {commentItem.userId === userId && (
              <>
                <button
                  type="button"
                  onClick={() => onStartEdit(commentItem)}
                >
                  수정
                </button>

                <button type="button" onClick={() => onDelete(commentItem)}>
                  삭제
                </button>
              </>
            )}

            <ReactionButtons
              disabled={pendingReactionKey === `comment-${commentItem.id}`}
              summary={commentReactions[commentItem.id] ?? EMPTY_REACTION}
              onReact={(reaction) => onReact(commentItem.id, reaction)}
            />
          </div>
        )}

        {!commentItem.isDeleted && isReplying && (
          <form
            className={styles.replyForm}
            onSubmit={(event) => onReplySubmit(event, commentItem)}
          >
            <textarea
              value={reply}
              onChange={(event) => onReplyChange(event.target.value)}
              onKeyDown={submitFormOnEnter}
              placeholder={`${commentItem.author}님에게 답글 입력`}
              aria-label="답글 내용"
              autoFocus
            />

            <div className={styles.replyActions}>
              <button
                type="button"
                className={styles.replyCancelButton}
                onClick={() => onReplyToggle(commentItem)}
              >
                취소
              </button>

              <button type="submit" disabled={!reply.trim()}>
                등록
              </button>
            </div>
          </form>
        )}

        {visibleReplies.length > 0 && (
          <ul className={styles.replyList}>
            {visibleReplies.map((replyItem) => (
              <CommunityCommentItem
                commentItem={replyItem}
                commentReactions={commentReactions}
                currentTime={currentTime}
                editedContent={editedContent}
                editingItem={editingItem}
                isReply
                key={replyItem.id}
                onCancelEdit={onCancelEdit}
                onChangeEditedContent={onChangeEditedContent}
                onDelete={onDelete}
                onReact={onReact}
                onReplyChange={onReplyChange}
                onReplySubmit={onReplySubmit}
                onReplyToggle={onReplyToggle}
                onSaveEdit={onSaveEdit}
                onStartEdit={onStartEdit}
                pendingReactionKey={pendingReactionKey}
                postCategory={postCategory}
                renderReplies={false}
                rootCommentId={commentItem.id}
                reply={reply}
                replyingTo={replyingTo}
                sportStats={sportStats}
                user={user}
                userId={userId}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
};

export default CommunityCommentItem;
