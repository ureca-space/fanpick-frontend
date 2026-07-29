import { supabase } from "../lib/supabase";

const COMMUNITY_IMAGE_BUCKET = "community-images";
const MAX_COMMUNITY_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_COMMUNITY_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const IMAGE_EXTENSION_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const validateCommunityImage = (file) => {
  if (!file) return;

  if (!ALLOWED_COMMUNITY_IMAGE_TYPES.includes(file.type)) {
    throw new Error("JPG, PNG, WEBP, GIF 이미지만 첨부할 수 있습니다.");
  }

  if (file.size > MAX_COMMUNITY_IMAGE_SIZE) {
    throw new Error("이미지는 최대 5MB까지 첨부할 수 있습니다.");
  }
};

const createCommunityImagePath = (userId, file) => {
  const extension =
    IMAGE_EXTENSION_BY_TYPE[file.type] ||
    file.name.split(".").pop()?.toLowerCase() ||
    "jpg";

  const randomId =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${userId}/${randomId}.${extension}`;
};

export const uploadCommunityPostImage = async ({ userId, file }) => {
  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }

  if (!file) {
    return null;
  }

  validateCommunityImage(file);

  const imagePath = createCommunityImagePath(userId, file);

  const { error: uploadError } = await supabase.storage
    .from(COMMUNITY_IMAGE_BUCKET)
    .upload(imagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(COMMUNITY_IMAGE_BUCKET)
    .getPublicUrl(imagePath);

  if (!data?.publicUrl) {
    try {
      await supabase.storage.from(COMMUNITY_IMAGE_BUCKET).remove([imagePath]);
    } catch (removeError) {
      console.error("URL 생성 실패 이미지 정리 오류:", removeError);
    }

    throw new Error("이미지 URL을 생성하지 못했습니다.");
  }

  return {
    imageUrl: data.publicUrl,
    imagePath,
  };
};

const uploadCommunityPostImages = async ({ userId, files = [] }) => {
  const uploadedImages = [];

  for (const file of files) {
    const uploadedImage = await uploadCommunityPostImage({
      userId,
      file,
    });

    if (uploadedImage) {
      uploadedImages.push(uploadedImage);
    }
  }

  return uploadedImages;
};

export const deleteCommunityPostImage = async (imagePath) => {
  if (!imagePath) return;

  const { error } = await supabase.storage
    .from(COMMUNITY_IMAGE_BUCKET)
    .remove([imagePath]);

  if (error) {
    throw error;
  }
};

const deleteCommunityPostImages = async (imagePaths = []) => {
  const uniqueImagePaths = [...new Set(imagePaths.filter(Boolean))];

  if (uniqueImagePaths.length === 0) return;

  const { error } = await supabase.storage
    .from(COMMUNITY_IMAGE_BUCKET)
    .remove(uniqueImagePaths);

  if (error) {
    throw error;
  }
};

const getPostImages = (post) => {
  const imageUrls = Array.isArray(post?.image_urls)
    ? post.image_urls.filter(Boolean)
    : [];

  const imagePaths = Array.isArray(post?.image_paths) ? post.image_paths : [];

  if (imageUrls.length > 0) {
    return imageUrls.map((imageUrl, index) => ({
      imageUrl,
      imagePath: imagePaths[index] || "",
    }));
  }

  if (post?.image_url) {
    return [
      {
        imageUrl: post.image_url,
        imagePath: post.image_path || "",
      },
    ];
  }

  return [];
};

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

const createReactionSummaries = (rows, targetKey, userId) =>
  (rows ?? []).reduce((summaries, row) => {
    const targetId = row[targetKey];

    const current = summaries[targetId] ?? {
      likeCount: 0,
      dislikeCount: 0,
      myReaction: null,
    };

    if (row.reaction === "like") {
      current.likeCount += 1;
    }

    if (row.reaction === "dislike") {
      current.dislikeCount += 1;
    }

    if (row.user_id === userId) {
      current.myReaction = row.reaction;
    }

    summaries[targetId] = current;

    return summaries;
  }, {});

const fetchReactionSummaries = async ({
  table,
  targetKey,
  targetIds,
  userId,
}) => {
  const ids = [...new Set(targetIds.filter(Boolean).map(Number))];

  if (ids.length === 0) return {};

  const { data, error } = await supabase
    .from(table)
    .select(`${targetKey}, user_id, reaction`)
    .in(targetKey, ids);

  if (error) throw error;

  return createReactionSummaries(data, targetKey, userId);
};

const toggleReaction = async ({
  table,
  targetKey,
  targetId,
  userId,
  reaction,
}) => {
  const { data: currentReaction, error: selectError } = await supabase
    .from(table)
    .select("reaction")
    .eq(targetKey, targetId)
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) throw selectError;

  if (currentReaction?.reaction === reaction) {
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq(targetKey, targetId)
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    return null;
  }

  const { error: upsertError } = await supabase.from(table).upsert(
    {
      [targetKey]: Number(targetId),
      user_id: userId,
      reaction,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: `${targetKey},user_id`,
    },
  );

  if (upsertError) throw upsertError;

  return reaction;
};

export const fetchCommunityPosts = async () => {
  const [
    { data: posts, error: postsError },
    { data: comments, error: commentsError },
    { data: reactions, error: reactionsError },
  ] = await Promise.all([
    supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false }),

    supabase.from("community_comments").select("post_id"),

    supabase
      .from("community_post_reactions")
      .select("post_id, reaction")
      .eq("reaction", "like"),
  ]);

  if (postsError) throw postsError;
  if (commentsError) throw commentsError;
  if (reactionsError) throw reactionsError;

  const commentCounts = (comments ?? []).reduce((counts, comment) => {
    counts[comment.post_id] = (counts[comment.post_id] ?? 0) + 1;

    return counts;
  }, {});

  const supportCounts = (reactions ?? []).reduce((counts, reaction) => {
    counts[reaction.post_id] = (counts[reaction.post_id] ?? 0) + 1;

    return counts;
  }, {});

  const postsWithCommentCount = (posts ?? []).map((post) => ({
    ...post,
    commentCount: commentCounts[post.id] ?? 0,
    supportCount: supportCounts[post.id] ?? 0,
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
  imageFile = null,
  imageFiles = [],
}) => {
  if (!user?.id) {
    throw new Error("로그인이 필요합니다.");
  }

  const targetImageFiles =
    imageFiles.length > 0 ? imageFiles : [imageFile].filter(Boolean);
  let uploadedImages = [];

  try {
    if (targetImageFiles.length > 0) {
      uploadedImages = await uploadCommunityPostImages({
        userId: user.id,
        files: targetImageFiles,
      });
    }

    const imageUrls = uploadedImages.map((image) => image.imageUrl);
    const imagePaths = uploadedImages.map((image) => image.imagePath);

    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: user.id,
        category,
        title,
        content,
        image_url: imageUrls[0] ?? null,
        image_path: imagePaths[0] ?? null,
        image_urls: imageUrls,
        image_paths: imagePaths,
        author_name: user.user_metadata?.nickname || "FanPick 사용자",
        author_avatar_url: user.user_metadata?.avatar_url || null,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    if (uploadedImages.length > 0) {
      try {
        await deleteCommunityPostImages(
          uploadedImages.map((image) => image.imagePath),
        );
      } catch (deleteError) {
        console.error("게시글 이미지 롤백 오류:", deleteError);
      }
    }

    throw error;
  }
};

export const updateCommunityPost = async (
  postId,
  {
    category,
    title,
    content,
    imageFile = null,
    imageFiles = [],
    removeImage = false,
    retainedImagePaths = null,
  },
) => {
  const { data: currentPost, error: fetchError } = await supabase
    .from("community_posts")
    .select("user_id, image_url, image_path, image_urls, image_paths")
    .eq("id", postId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  const currentImages = getPostImages(currentPost);
  const shouldUseRetainedImagePaths = Array.isArray(retainedImagePaths);
  const retainedImagePathSet = new Set(
    shouldUseRetainedImagePaths ? retainedImagePaths.filter(Boolean) : [],
  );
  const retainedImages = shouldUseRetainedImagePaths
    ? currentImages.filter((image) => retainedImagePathSet.has(image.imagePath))
    : removeImage
      ? []
      : currentImages;
  const targetImageFiles =
    imageFiles.length > 0 ? imageFiles : [imageFile].filter(Boolean);
  let uploadedImages = [];

  try {
    if (targetImageFiles.length > 0) {
      uploadedImages = await uploadCommunityPostImages({
        userId: currentPost.user_id,
        files: targetImageFiles,
      });
    }

    const nextImages = [...retainedImages, ...uploadedImages];
    const nextImageUrls = nextImages.map((image) => image.imageUrl);
    const nextImagePaths = nextImages.map((image) => image.imagePath);

    const { error: updateError } = await supabase
      .from("community_posts")
      .update({
        category,
        title,
        content,
        image_url: nextImageUrls[0] ?? null,
        image_path: nextImagePaths[0] ?? null,
        image_urls: nextImageUrls,
        image_paths: nextImagePaths,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (updateError) {
      throw updateError;
    }

    const nextImagePathSet = new Set(nextImagePaths);
    const imagePathsToDelete = currentImages
      .map((image) => image.imagePath)
      .filter((imagePath) => imagePath && !nextImagePathSet.has(imagePath));

    if (imagePathsToDelete.length > 0) {
      try {
        await deleteCommunityPostImages(imagePathsToDelete);
      } catch (deleteError) {
        console.error("기존 게시글 이미지 삭제 오류:", deleteError);
      }
    }
  } catch (error) {
    if (uploadedImages.length > 0) {
      try {
        await deleteCommunityPostImages(
          uploadedImages.map((image) => image.imagePath),
        );
      } catch (deleteError) {
        console.error("새 게시글 이미지 롤백 오류:", deleteError);
      }
    }

    throw error;
  }
};

export const deleteCommunityPost = async (postId) => {
  const { data: post, error: fetchError } = await supabase
    .from("community_posts")
    .select("image_path, image_paths")
    .eq("id", postId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  const { error: deleteError } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", postId);

  if (deleteError) {
    throw deleteError;
  }

  const imagePathsToDelete = [
    ...(Array.isArray(post.image_paths) ? post.image_paths : []),
    post.image_path,
  ];

  if (imagePathsToDelete.some(Boolean)) {
    try {
      await deleteCommunityPostImages(imagePathsToDelete);
    } catch (imageDeleteError) {
      console.error("게시글 첨부 이미지 삭제 오류:", imageDeleteError);
    }
  }
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
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
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

export const fetchCommunityPostReactions = (postIds, userId) =>
  fetchReactionSummaries({
    table: "community_post_reactions",
    targetKey: "post_id",
    targetIds: postIds,
    userId,
  });

export const fetchCommunityCommentReactions = (commentIds, userId) =>
  fetchReactionSummaries({
    table: "community_comment_reactions",
    targetKey: "comment_id",
    targetIds: commentIds,
    userId,
  });

export const toggleCommunityPostReaction = ({ postId, userId, reaction }) =>
  toggleReaction({
    table: "community_post_reactions",
    targetKey: "post_id",
    targetId: postId,
    userId,
    reaction,
  });

export const toggleCommunityCommentReaction = ({
  commentId,
  userId,
  reaction,
}) =>
  toggleReaction({
    table: "community_comment_reactions",
    targetKey: "comment_id",
    targetId: commentId,
    userId,
    reaction,
  });

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
