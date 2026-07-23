import { supabase } from "../lib/supabase";

export const fetchCommunityPosts = async (userId) => {
  const [{ data: posts, error: postsError }, { data: comments, error: commentsError }] =
    await Promise.all([
      supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("community_comments").select("post_id, user_id"),
    ]);

  if (postsError) throw postsError;
  if (commentsError) throw commentsError;

  const commentCounts = (comments ?? []).reduce((counts, comment) => {
    counts[comment.post_id] = (counts[comment.post_id] ?? 0) + 1;
    return counts;
  }, {});
  const myCommentedPostIds = new Set(
    (comments ?? [])
      .filter((comment) => comment.user_id === userId)
      .map((comment) => comment.post_id),
  );

  return (posts ?? []).map((post) => ({
    ...post,
    commentCount: commentCounts[post.id] ?? 0,
    hasMyComment: myCommentedPostIds.has(post.id),
  }));
};

export const fetchCommunityPost = async (postId) => {
  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error) throw error;
  return data;
};

export const createCommunityPost = async ({ user, category, title, content }) => {
  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: user.id,
      category,
      title,
      content,
      author_name: user.user_metadata?.nickname || "FanPick 사용자",
      author_avatar_url: user.user_metadata?.avatar_url || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
};

export const updateCommunityPost = async (postId, { category, title, content }) => {
  const { error } = await supabase
    .from("community_posts")
    .update({
      category,
      title,
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) throw error;
};

export const deleteCommunityPost = async (postId) => {
  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", postId);

  if (error) throw error;
};

export const fetchCommunityComments = async (postId) => {
  const { data, error } = await supabase
    .from("community_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const createCommunityComment = async ({
  user,
  postId,
  parentId = null,
  content,
}) => {
  const { data, error } = await supabase
    .from("community_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      parent_id: parentId,
      content,
      author_name: user.user_metadata?.nickname || "FanPick 사용자",
      author_avatar_url: user.user_metadata?.avatar_url || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const updateCommunityComment = async (commentId, content) => {
  const { error } = await supabase
    .from("community_comments")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", commentId);

  if (error) throw error;
};

export const deleteCommunityComment = async (commentId) => {
  const { error } = await supabase
    .from("community_comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;
};

export const increaseCommunityPostView = async (postId) => {
  const { data, error } = await supabase.rpc("increment_community_post_view", {
    target_post_id: Number(postId),
  });

  if (error) throw error;

  return data == null ? null : Number(data);
};

// 커뮤니티 작성자들의 종목별 예측 횟수와 적중률만 조회
export const fetchCommunityPredictionStats = async (userIds) => {
  const targetUserIds = [...new Set(userIds.filter(Boolean))];

  if (targetUserIds.length === 0) return [];

  const { data, error } = await supabase.rpc(
    "get_community_prediction_stats",
    {
      target_user_ids: targetUserIds,
    },
  );

  if (error) throw error;

  return data ?? [];
};
