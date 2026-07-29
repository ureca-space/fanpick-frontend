import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "../../../components/Button/Button";
import FanPickDialog from "../../../components/FanPickDialog/FanPickDialog";
import useAuth from "../../../contexts/useAuth";
import useFanPickDialog from "../../../hooks/useFanPickDialog";
import {
  createCommunityPost,
  fetchCommunityPost,
  updateCommunityPost,
} from "../../../services/communityApi";
import { CATEGORIES } from "../communityConstants";
import {
  getCommunityPostImages,
  MAX_COMMUNITY_POST_IMAGES,
} from "../communityImageUtils";
import styles from "./CommunityWritePage.module.css";

const CATEGORY_OPTIONS = CATEGORIES.filter(
  (category) => category.id !== "all",
).map((category) => ({
  value: category.id,
  label: category.label,
}));

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const CommunityWritePage = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const { user, isAuthLoading } = useAuth();
  const fileInputRef = useRef(null);
  const newImagesRef = useRef([]);

  const isEditMode = Boolean(postId);

  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(isEditMode);
  const { dialogProps, showDialog } = useFanPickDialog({
    lockBodyScroll: false,
  });

  useEffect(() => {
    if (!isEditMode) {
      return undefined;
    }

    if (isAuthLoading) {
      return undefined;
    }

    if (!user) {
      navigate("/login", {
        replace: true,
        state: {
          from: `/community/${postId}/edit`,
        },
      });

      return undefined;
    }

    let isMounted = true;

    const loadPost = async () => {
      try {
        setIsLoadingPost(true);

        const post = await fetchCommunityPost(postId);

        if (!isMounted) return;

        if (post.user_id !== user.id) {
          const moveToPost = () => {
            navigate(`/community/${postId}`, { replace: true });
          };

          showDialog({
            description: "작성자만 게시글을 수정할 수 있습니다.",
            onClose: moveToPost,
            onConfirm: moveToPost,
            title: "수정 권한 없음",
          });
          return;
        }

        setCategory(post.category ?? "");
        setTitle(post.title ?? "");
        setContent(post.content ?? "");
        setExistingImages(getCommunityPostImages(post));
        setNewImages([]);
      } catch (error) {
        console.error("수정할 게시글 조회 오류:", error);

        if (!isMounted) return;

        const moveToCommunity = () => {
          navigate("/community", { replace: true });
        };

        showDialog({
          description: "게시글을 불러오지 못했습니다.",
          onClose: moveToCommunity,
          onConfirm: moveToCommunity,
          title: "게시글 조회 실패",
        });
      } finally {
        if (isMounted) {
          setIsLoadingPost(false);
        }
      }
    };

    loadPost();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, isEditMode, navigate, postId, showDialog, user]);

  useEffect(() => {
    newImagesRef.current = newImages;
  }, [newImages]);

  useEffect(() => {
    return () => {
      newImagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  const imagePreviews = [...existingImages, ...newImages];

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) return;

    const availableImageCount =
      MAX_COMMUNITY_POST_IMAGES - imagePreviews.length;

    if (availableImageCount <= 0) {
      showDialog({
        description: `이미지는 최대 ${MAX_COMMUNITY_POST_IMAGES}장까지 첨부할 수 있습니다.`,
        title: "이미지 첨부 불가",
      });
      event.target.value = "";
      return;
    }

    const targetFiles = selectedFiles.slice(0, availableImageCount);

    const invalidTypeFile = targetFiles.find(
      (file) => !ALLOWED_IMAGE_TYPES.includes(file.type),
    );

    if (invalidTypeFile) {
      showDialog({
        description: "JPG, PNG, WEBP, GIF 이미지만 첨부할 수 있습니다.",
        title: "지원하지 않는 파일 형식",
      });
      event.target.value = "";
      return;
    }

    const oversizedFile = targetFiles.find((file) => file.size > MAX_IMAGE_SIZE);

    if (oversizedFile) {
      showDialog({
        description: "이미지는 최대 5MB까지 첨부할 수 있습니다.",
        title: "이미지 용량 초과",
      });
      event.target.value = "";
      return;
    }

    if (selectedFiles.length > availableImageCount) {
      showDialog({
        description: `이미지는 최대 ${MAX_COMMUNITY_POST_IMAGES}장까지 첨부할 수 있습니다.`,
        title: "일부 이미지만 첨부됨",
      });
    }

    const selectedImages = targetFiles.map((file) => {
      const id =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);

      return {
        file,
        id,
        previewUrl,
        url: previewUrl,
      };
    });

    setNewImages((currentImages) => [...currentImages, ...selectedImages]);

    event.target.value = "";
  };

  const handleRemoveExistingImage = (imageId) => {
    setExistingImages((currentImages) =>
      currentImages.filter((image) => image.id !== imageId),
    );
  };

  const handleRemoveNewImage = (imageId) => {
    setNewImages((currentImages) => {
      const targetImage = currentImages.find((image) => image.id === imageId);

      if (targetImage) {
        URL.revokeObjectURL(targetImage.previewUrl);
      }

      return currentImages.filter((image) => image.id !== imageId);
    });
  };

  const handleClearImages = () => {
    newImages.forEach((image) => {
      URL.revokeObjectURL(image.previewUrl);
    });

    setNewImages([]);
    setExistingImages([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !category ||
      !title.trim() ||
      !content.trim() ||
      isSubmitting ||
      isLoadingPost
    ) {
      return;
    }

    if (!user) {
      const moveToLogin = () => {
        navigate("/login", {
          state: {
            from: isEditMode ? `/community/${postId}/edit` : "/community/write",
          },
        });
      };

      showDialog({
        cancelText: "취소",
        confirmText: "로그인하기",
        description: "로그인 후 글을 작성할 수 있습니다.",
        onConfirm: moveToLogin,
        title: "로그인이 필요합니다",
      });

      return;
    }

    try {
      setIsSubmitting(true);

      const postData = {
        category,
        title: title.trim(),
        content: content.trim(),
        imageFiles: newImages.map((image) => image.file),
      };

      if (isEditMode) {
        await updateCommunityPost(postId, {
          ...postData,
          removeImage: imagePreviews.length === 0,
          retainedImagePaths: existingImages.map((image) => image.path),
        });

        navigate(`/community/${postId}`, {
          replace: true,
        });

        return;
      }

      const createdPost = await createCommunityPost({
        user,
        ...postData,
      });

      navigate(`/community/${createdPost.id}`, {
        replace: true,
      });
    } catch (error) {
      console.error("게시글 저장 오류:", error);

      showDialog({
        description: `게시글을 저장하지 못했습니다.${
          error?.message ? `\n${error.message}` : ""
        }`,
        title: "게시글 저장 실패",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      navigate(`/community/${postId}`);
      return;
    }

    navigate("/community");
  };

  const isSubmitDisabled =
    !category ||
    !title.trim() ||
    !content.trim() ||
    isSubmitting ||
    isLoadingPost;

  if (isLoadingPost) {
    return (
      <section className={styles.page}>
        <div className={`container ${styles.inner}`}>
          <div className={styles.loadingMessage}>
            게시글을 불러오는 중입니다.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <form className={styles.editor} onSubmit={handleSubmit}>
          <div className={styles.editorHeader}>
            <h1>{isEditMode ? "글 수정" : "글쓰기"}</h1>

            <div
              className={`${styles.selectWrap} ${
                isSelectOpen ? styles.selectOpen : ""
              }`}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setIsSelectOpen(false);
                }
              }}
            >
              <button
                type="button"
                className={styles.selectButton}
                onClick={() => setIsSelectOpen((isOpen) => !isOpen)}
                aria-label="게시판 선택"
                aria-haspopup="listbox"
                aria-expanded={isSelectOpen}
              >
                {CATEGORY_OPTIONS.find((option) => option.value === category)
                  ?.label ?? "게시판을 선택하세요"}
              </button>

              {isSelectOpen && (
                <ul className={styles.selectMenu} role="listbox">
                  {CATEGORY_OPTIONS.map((option) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        className={
                          category === option.value ? styles.selectedOption : ""
                        }
                        onClick={() => {
                          setCategory(option.value);
                          setIsSelectOpen(false);
                        }}
                        role="option"
                        aria-selected={category === option.value}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <input
            className={styles.titleInput}
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="제목을 입력해주세요"
            maxLength={100}
            aria-label="게시글 제목"
          />

          <textarea
            className={styles.contentInput}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="함께 나누고 싶은 얘기를 남겨주세요."
            maxLength={5000}
            aria-label="게시글 내용"
          />

          <div className={styles.imageSection}>
            <div className={styles.imageSectionHeader}>
              <div>
                <strong>사진 첨부</strong>
                <p>
                  JPG, PNG, WEBP, GIF · 최대 {MAX_COMMUNITY_POST_IMAGES}장 · 각
                  5MB
                </p>
              </div>

              <label className={styles.imageSelectButton}>
                이미지 추가
                <input
                  ref={fileInputRef}
                  className={styles.imageInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleImageChange}
                />
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className={styles.imagePreviewArea}>
                <div className={styles.imagePreviewGrid}>
                  {imagePreviews.map((image, index) => (
                    <div className={styles.imagePreviewItem} key={image.id}>
                      <img
                        className={styles.imagePreview}
                        src={image.url}
                        alt={`게시글 첨부 이미지 미리보기 ${index + 1}`}
                      />

                      <button
                        type="button"
                        className={styles.imageRemoveButton}
                        onClick={() =>
                          image.file
                            ? handleRemoveNewImage(image.id)
                            : handleRemoveExistingImage(image.id)
                        }
                        aria-label={`첨부 이미지 ${index + 1} 삭제`}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className={styles.imageClearButton}
                  onClick={handleClearImages}
                >
                  전체 삭제
                </button>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <Button
              type="button"
              onClick={handleCancel}
              variant="secondary"
              disabled={isSubmitting}
            >
              취소
            </Button>

            <Button type="submit" disabled={isSubmitDisabled}>
              {isSubmitting ? "저장 중..." : isEditMode ? "수정" : "등록"}
            </Button>
          </div>
        </form>
      </div>

      <FanPickDialog {...dialogProps} />
    </section>
  );
};

export default CommunityWritePage;
