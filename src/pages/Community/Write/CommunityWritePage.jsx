import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CommunityWritePage.module.css";

const CATEGORY_OPTIONS = [
  { value: "lck", label: "LCK" },
  { value: "baseball", label: "국내야구" },
  { value: "soccer", label: "국내축구" },
];

const CommunityWritePage = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    // - Supabase posts 테이블 연결 후 이 위치에서 저장
    if (!category || !title.trim() || !content.trim()) return;

    navigate("/community");
  };

  return (
    <section className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <form className={styles.editor} onSubmit={handleSubmit}>
          <div className={styles.editorHeader}>
            <h1>글쓰기</h1>

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
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => navigate("/community")}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!category || !title.trim() || !content.trim()}
            >
              등록
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CommunityWritePage;
