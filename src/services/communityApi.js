import { supabase } from "../lib/supabase";

// 게시글·댓글에 저장된 user_id로 최신 공개 프로필을 연결
const attachLatestProfiles = async (rows = []) => {
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];

  if (userIds.length === 0) return rows;

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("user_id, nickname, avatar_url")
    .in("user_id", userIds);

  // 프로필 조회가 실패해도 게시글과 댓글은 기존 작성자 정보로 표시
  if (error) {
    console.error("커뮤니티 프로필 조회 오류:", error);
    return rows;
  }

  const profileByUserId = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile]),
  );

  return rows.map((row) => {
    const profile = profileByUserId.get(row.user_id);

    if (!profile) return row;

    return {
      ...row,
      author_name: profile.nickname || row.author_name,
      author_avatar_url: profile.avatar_url,
    };
  });
};

export const fetchCommunityPosts = async () => {
  const [
    { data: posts, error: postsError },
    { data: comments, error: commentsError },
  ] = await Promise.all([
    supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("community_comments").select("post_id"),
  ]);

  if (postsError) throw postsError;
  if (commentsError) throw commentsError;

  const commentCounts = (comments ?? []).reduce((counts, comment) => {
    counts[comment.post_id] = (counts[comment.post_id] ?? 0) + 1;
    return counts;
  }, {});
  const postsWithCommentCount = (posts ?? []).map((post) => ({
    ...post,
    commentCount: commentCounts[post.id] ?? 0,
  }));

  return attachLatestProfiles(postsWithCommentCount);
};

export const fetchMyCommunityComments = async (userId) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("community_comments")
    .select("id, post_id, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
};

export const fetchCommunityPost = async (postId) => {
  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error) throw error;

  const [post] = await attachLatestProfiles([data]);
  return post;
};

export const createCommunityPost = async ({
  user,
  category,
  title,
  content,
}) => {
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

export const updateCommunityPost = async (
  postId,
  { category, title, content },
) => {
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

  return attachLatestProfiles(data ?? []);
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

// 부모 댓글은 행을 유지하고 삭제 상태만 변경해 답글 연결을 보존
export const softDeleteCommunityComment = async (commentId) => {
  const { error } = await supabase
    .from("community_comments")
    .update({
      is_deleted: true,
      updated_at: new Date().toISOString(),
    })
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
  const { data, error } = await supabase.rpc("record_community_post_view", {
    target_post_id: Number(postId),
  });

  if (error) throw error;

  return data == null ? null : Number(data);
};

// 커뮤니티 작성자들의 종목별 예측 횟수와 적중률만 조회
export const fetchCommunityPredictionStats = async (userIds) => {
  const targetUserIds = [...new Set(userIds.filter(Boolean))];

  if (targetUserIds.length === 0) return [];

  const { data, error } = await supabase.rpc("get_community_prediction_stats", {
    target_user_ids: targetUserIds,
  });

  if (error) throw error;

  return data ?? [];
};
