export const MAX_COMMUNITY_POST_IMAGES = 5;

export const getCommunityPostImages = (post) => {
  if (!post) return [];

  const imageUrls = Array.isArray(post.image_urls)
    ? post.image_urls.filter(Boolean)
    : [];

  const imagePaths = Array.isArray(post.image_paths)
    ? post.image_paths
    : [];

  if (imageUrls.length > 0) {
    return imageUrls.map((url, index) => ({
      id: imagePaths[index] || url,
      path: imagePaths[index] || "",
      url,
    }));
  }

  if (post.image_url) {
    return [
      {
        id: post.image_path || post.image_url,
        path: post.image_path || "",
        url: post.image_url,
      },
    ];
  }

  return [];
};
