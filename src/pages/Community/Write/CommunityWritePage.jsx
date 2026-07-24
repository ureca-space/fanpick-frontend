import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/Button/Button";
import useAuth from "../../../contexts/useAuth";
import {
  createCommunityPost,
  fetchCommunityPost,
  updateCommunityPost,
} from "../../../services/communityApi";
import styles from "./CommunityWritePage.module.css";

const CATEGORY_OPTIONS = [
  { value: "lck", label: "LCK" },
  { value: "baseball", label: "KBO" },
  { value: "soccer", label: "K-LEAGUE" },
];

const CommunityWritePage = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const { user } = useAuth();
  const isEditMode = Boolean(postId);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;

    const loadPost = async () => {
      try {
        const post = await fetchCommunityPost(postId);

        if (post.user_id !== user?.id) {
          alert("작성자만 게시글을 수정할 수 있습니다.");
          navigate(`/community/${postId}`, { replace: true });
          return;
        }

        setCategory(post.category);
        setTitle(post.title);
        setContent(post.content);
      } catch (error) {
        console.error("수정할 게시글 조회 오류:", error);
        alert("게시글을 불러오지 못했습니다.");
        navigate("/community", { replace: true });
      }
    };

    if (user) loadPost();
  }, [isEditMode, navigate, postId, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!category || !title.trim() || !content.trim() || isSubmitting) return;
    if (!user) {
      alert("로그인 후 글을 작성할 수 있습니다.");
      navigate("/login", { state: { from: "/community/write" } });
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode) {
        await updateCommunityPost(postId, {
          category,
          title: title.trim(),
          content: content.trim(),
        });
        navigate(`/community/${postId}`, { replace: true });
      } else {
        const post = await createCommunityPost({
          user,
          category,
          title: title.trim(),
          content: content.trim(),
        });
        navigate(`/community/${post.id}`, { replace: true });
      }
    } catch (error) {
      console.error("게시글 저장 오류:", error);
      alert(`게시글을 저장하지 못했습니다.\n${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <form className={styles.editor} onSubmit={handleSubmit}>
          <div className={styles.editorHeader}>
            <h1>{isEditMode ? "글 수정" : "글쓰기"}</h1>

            <div
              className={`${styles.selectWrap} ${isSelectOpen ? styles.selectOpen : ""}`}
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

          <div className={styles.actions}>
            <Button
              type="button"
              onClick={() => navigate("/community")}
              variant="secondary"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={
                !category || !title.trim() || !content.trim() || isSubmitting
              }
            >
              {isSubmitting ? "저장 중..." : isEditMode ? "수정" : "등록"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CommunityWritePage;
