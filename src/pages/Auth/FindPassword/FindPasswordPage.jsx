import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import styles from "../AuthPage.module.css";

const FindPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isSubmitAvailable = email.trim() !== "" && !isSubmitting;

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage("이메일을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (error) {
        throw error;
      }

      setSuccessMessage(
        "비밀번호 재설정 메일을 전송했습니다. 이메일을 확인해 주세요.",
      );
    } catch (error) {
      console.error("비밀번호 재설정 메일 전송 실패:", error);

      if (error.message?.toLowerCase().includes("rate limit")) {
        setErrorMessage(
          "요청 횟수가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
        );
      } else {
        setErrorMessage("비밀번호 재설정 메일 전송에 실패했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.authPage}>
      <section className={styles.authContainer}>
        <h1 className={styles.title}>비밀번호 찾기</h1>

        <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <input
              id="find-password-email"
              className={styles.input}
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="이메일을 입력해 주세요."
              autoComplete="email"
            />
          </div>

          {errorMessage && (
            <p className={styles.errorMessage} role="alert">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className={styles.successMessage} role="status">
              {successMessage}
            </p>
          )}

          <button
            className={styles.submitButton}
            type="submit"
            disabled={!isSubmitAvailable}
          >
            {isSubmitting ? "전송 중..." : "재설정 메일 보내기"}
          </button>
        </form>

        <nav className={styles.accountMenu}>
          <Link to="/login">로그인</Link>

          <span className={styles.divider} />

          <Link to="/signup">회원가입</Link>
        </nav>
      </section>
    </main>
  );
};

export default FindPasswordPage;
