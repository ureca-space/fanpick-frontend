import { formatRelativeTime } from "../../../utils/formatRelativeTime";
import { CATEGORIES } from "../communityConstants";
import { getCommunityPostImages } from "../communityImageUtils";

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category.label]),
);

export const CATEGORY_SPORT = {
  free: "overall",
  lck: "esports",
  baseball: "baseball",
  soccer: "soccer",
};

export const PREDICTION_SPORTS = ["soccer", "baseball", "esports"];

export const EMPTY_REACTION = {
  likeCount: 0,
  dislikeCount: 0,
  myReaction: null,
};

export const updateReactionSummary = (summary, nextReaction) => {
  const nextSummary = {
    ...EMPTY_REACTION,
    ...summary,
  };

  if (nextSummary.myReaction === "like") {
    nextSummary.likeCount -= 1;
  }

  if (nextSummary.myReaction === "dislike") {
    nextSummary.dislikeCount -= 1;
  }

  if (nextReaction === "like") {
    nextSummary.likeCount += 1;
  }

  if (nextReaction === "dislike") {
    nextSummary.dislikeCount += 1;
  }

  nextSummary.myReaction = nextReaction;

  return nextSummary;
};

export const formatCommentTime = (date, updatedAt, currentTime) => {
  const formatted = formatRelativeTime(updatedAt || date, currentTime);

  return updatedAt && updatedAt !== date ? `${formatted} · 수정됨` : formatted;
};

export const submitFormOnEnter = (event) => {
  if (
    event.key !== "Enter" ||
    event.shiftKey ||
    event.nativeEvent?.isComposing
  ) {
    return;
  }

  event.preventDefault();
  event.currentTarget.form?.requestSubmit();
};

export const normalizePost = (post) => ({
  ...post,
  author: post.author_name,
  avatarUrl: post.author_avatar_url,
  createdAt: post.created_at,
  views: Number(post.view_count ?? 0),
  images: getCommunityPostImages(post),
});

export const normalizeComments = (rows) => {
  const normalize = (row) => ({
    id: row.id,
    parentId: row.parent_id,
    parentAuthor: "",
    userId: row.user_id,
    author: row.author_name,
    avatarUrl: row.author_avatar_url,
    content: row.content,
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    replies: [],
  });

  const commentMap = new Map(rows.map((row) => [row.id, normalize(row)]));
  const roots = [];

  commentMap.forEach((commentItem) => {
    if (commentItem.parentId && commentMap.has(commentItem.parentId)) {
      const parentComment = commentMap.get(commentItem.parentId);

      commentItem.parentAuthor = parentComment.isDeleted
        ? "삭제된 댓글"
        : parentComment.author;
      parentComment.replies.push(commentItem);
      return;
    }

    roots.push(commentItem);
  });

  return roots;
};

export const countComments = (commentList) =>
  commentList.reduce(
    (count, item) => count + 1 + countComments(item.replies ?? []),
    0,
  );

export const flattenReplies = (replyList) =>
  replyList.flatMap((item) => [item, ...flattenReplies(item.replies ?? [])]);
