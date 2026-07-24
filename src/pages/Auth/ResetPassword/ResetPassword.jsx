import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import styles from "../AuthPage.module.css";

const PASSWORD_PATTERN =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

const ResetPasswordPage = () => {
  const navigate = useNavigate();

  const [passwordForm, setPasswordForm] = useState({
    password: "",
    passwordConfirm: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  const isSubmitAvailable =
    passwordForm.password.trim() !== "" &&
    passwordForm.passwordConfirm.trim() !== "" &&
    !isSubmitting;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const password = passwordForm.password.trim();
    const passwordConfirm = passwordForm.passwordConfirm.trim();

    if (!PASSWORD_PATTERN.test(password)) {
      setErrorMessage(
        "비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요.",
      );
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setErrorMessage(
          "비밀번호 재설정 링크가 만료되었습니다. 재설정 메일을 다시 요청해 주세요.",
        );
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setIsCompleted(true);
      setPasswordForm({
        password: "",
        passwordConfirm: "",
      });
    } catch (error) {
      console.error("비밀번호 변경 실패:", error);

      if (error.message?.toLowerCase().includes("same password")) {
        setErrorMessage("기존 비밀번호와 다른 비밀번호를 입력해 주세요.");
      } else {
        setErrorMessage(
          "비밀번호 변경에 실패했습니다. 재설정 메일을 다시 요청해 주세요.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginMove = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (isCompleted) {
    return (
      <main className={styles.authPage}>
        <section className={styles.authContainer}>
          <h1 className={styles.title}>비밀번호 변경 완료</h1>

          <p className={styles.description}>
            비밀번호가 정상적으로 변경되었습니다.
            <br />
            새로운 비밀번호로 로그인해 주세요.
          </p>

          <button
            className={styles.submitButton}
            type="button"
            onClick={handleLoginMove}
          >
            로그인하러 가기
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.authPage}>
      <section className={styles.authContainer}>
        <h1 className={styles.title}>비밀번호 재설정</h1>

        <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <input
              id="reset-password"
              className={styles.input}
              type="password"
              name="password"
              value={passwordForm.password}
              onChange={handleChange}
              placeholder="새 비밀번호를 입력해 주세요."
              autoComplete="new-password"
            />

            <p className={styles.helperText}>
              영문, 숫자, 특수문자를 포함해 8자 이상
            </p>
          </div>

          <div className={styles.field}>
            <input
              id="reset-password-confirm"
              className={styles.input}
              type="password"
              name="passwordConfirm"
              value={passwordForm.passwordConfirm}
              onChange={handleChange}
              placeholder="새 비밀번호를 다시 입력해 주세요."
              autoComplete="new-password"
            />
          </div>

          {errorMessage && (
            <p className={styles.errorMessage} role="alert">
              {errorMessage}
            </p>
          )}

          <button
            className={styles.submitButton}
            type="submit"
            disabled={!isSubmitAvailable}
          >
            {isSubmitting ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>

        <nav className={styles.accountMenu}>
          <Link to="/find-password">재설정 메일 다시 받기</Link>

          <span className={styles.divider} />

          <Link to="/login">로그인</Link>
        </nav>
      </section>
    </main>
  );
};

export default ResetPasswordPage;
