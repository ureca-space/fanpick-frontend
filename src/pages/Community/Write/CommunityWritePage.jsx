import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/Button/Button";
import useAuth from "../../../contexts/useAuth";
import {
  createCommunityPost,
  fetchCommunityPost,
  updateCommunityPost,
} from "../../../services/communityApi";
import { CATEGORIES } from "../communityConstants";
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
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const isEditMode = Boolean(postId);

  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [removeImage, setRemoveImage] = useState(false);

  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(isEditMode);

  useEffect(() => {
    if (!isEditMode || !user) {
      setIsLoadingPost(false);
      return;
    }

    let isMounted = true;

    const loadPost = async () => {
      try {
        setIsLoadingPost(true);

        const post = await fetchCommunityPost(postId);

        if (!isMounted) return;

        if (post.user_id !== user.id) {
          alert("작성자만 게시글을 수정할 수 있습니다.");
          navigate(`/community/${postId}`, { replace: true });
          return;
        }

        setCategory(post.category ?? "");
        setTitle(post.title ?? "");
        setContent(post.content ?? "");
        setExistingImageUrl(post.image_url ?? "");
        setRemoveImage(false);
      } catch (error) {
        console.error("수정할 게시글 조회 오류:", error);

        if (!isMounted) return;

        alert("게시글을 불러오지 못했습니다.");
        navigate("/community", { replace: true });
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
  }, [isEditMode, navigate, postId, user]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(existingImageUrl);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(imageFile);

    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [existingImageUrl, imageFile]);

  const handleImageChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!ALLOWED_IMAGE_TYPES.includes(selectedFile.type)) {
      alert("JPG, PNG, WEBP, GIF 이미지만 첨부할 수 있습니다.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_IMAGE_SIZE) {
      alert("이미지는 최대 5MB까지 첨부할 수 있습니다.");
      event.target.value = "";
      return;
    }

    setImageFile(selectedFile);
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setExistingImageUrl("");
    setRemoveImage(true);

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
      alert("로그인 후 글을 작성할 수 있습니다.");

      navigate("/login", {
        state: {
          from: isEditMode ? `/community/${postId}/edit` : "/community/write",
        },
      });

      return;
    }

    try {
      setIsSubmitting(true);

      const postData = {
        category,
        title: title.trim(),
        content: content.trim(),
        imageFile,
      };

      if (isEditMode) {
        await updateCommunityPost(postId, {
          ...postData,
          removeImage,
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

      alert(
        `게시글을 저장하지 못했습니다.${
          error?.message ? `\n${error.message}` : ""
        }`,
      );
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
                <p>JPG, PNG, WEBP, GIF · 최대 5MB</p>
              </div>

              <label className={styles.imageSelectButton}>
                이미지 선택
                <input
                  ref={fileInputRef}
                  className={styles.imageInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            {imagePreviewUrl && (
              <div className={styles.imagePreviewArea}>
                <img
                  className={styles.imagePreview}
                  src={imagePreviewUrl}
                  alt="게시글 첨부 이미지 미리보기"
                />

                <button
                  type="button"
                  className={styles.imageRemoveButton}
                  onClick={handleRemoveImage}
                  aria-label="첨부 이미지 삭제"
                >
                  이미지 삭제
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
    </section>
  );
};

export default CommunityWritePage;
