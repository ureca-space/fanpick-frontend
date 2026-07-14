import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FanPickDialog from "../../../components/FanPickDialog/FanPickDialog";
import { supabase } from "../../../lib/supabase.js";
import styles from "../AuthPage.module.css";

const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9_]{2,12}$/;

const SignupPage = () => {
  const navigate = useNavigate();

  const [signupForm, setSignupForm] = useState({
    nickname: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    passwordConfirm: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  const trimmedNickname = signupForm.nickname.trim();

  const isPasswordMatched = signupForm.password === signupForm.passwordConfirm;

  const isNicknameValid = NICKNAME_PATTERN.test(trimmedNickname);

  const isSignupAvailable =
    isNicknameValid &&
    signupForm.email.trim() !== "" &&
    signupForm.password.trim() !== "" &&
    signupForm.passwordConfirm.trim() !== "" &&
    isPasswordMatched;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setSignupForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSignupError("");
  };

  const handlePasswordVisibility = (name) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!isNicknameValid) {
      setSignupError(
        "닉네임은 한글, 영문, 숫자, 밑줄을 사용해 2~12자로 입력해 주세요.",
      );
      return;
    }

    if (!isPasswordMatched) {
      setSignupError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!isSignupAvailable) return;

    setIsSubmitting(true);
    setSignupError("");

    try {
      const { error } = await supabase.auth.signUp({
        email: signupForm.email.trim(),
        password: signupForm.password,
        options: {
          data: {
            nickname: trimmedNickname,
          },
        },
      });

      if (error) {
        if (error.message === "User already registered") {
          setSignupError("이미 가입된 이메일입니다.");
        } else if (error.message.includes("Password should be at least")) {
          setSignupError("비밀번호는 6자 이상 입력해 주세요.");
        } else {
          setSignupError(error.message);
        }

        return;
      }

      await supabase.auth.signOut();

      setIsSuccessDialogOpen(true);
    } catch (error) {
      console.error("회원가입 오류:", error);
      setSignupError("회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessConfirm = () => {
    setIsSuccessDialogOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <section className={styles.authPage}>
        <div className={styles.authContainer}>
          <h1 className={styles.title}>회원가입</h1>

          <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
            <label className={styles.srOnly} htmlFor="signup-nickname">
              닉네임
            </label>

            <input
              id="signup-nickname"
              className={styles.input}
              type="text"
              name="nickname"
              value={signupForm.nickname}
              onChange={handleChange}
              placeholder="닉네임을 입력해 주세요."
              autoComplete="nickname"
              maxLength={12}
            />

            {signupForm.nickname !== "" && !isNicknameValid && (
              <p className={styles.errorMessage}>
                닉네임은 한글, 영문, 숫자, 밑줄을 사용해 2~12자로 입력해 주세요.
              </p>
            )}

            <label className={styles.srOnly} htmlFor="signup-email">
              이메일
            </label>

            <input
              id="signup-email"
              className={styles.input}
              type="email"
              name="email"
              value={signupForm.email}
              onChange={handleChange}
              placeholder="이메일을 입력해 주세요."
              autoComplete="email"
            />

            <div className={styles.passwordField}>
              <label className={styles.srOnly} htmlFor="signup-password">
                비밀번호
              </label>

              <input
                id="signup-password"
                className={styles.input}
                type={passwordVisibility.password ? "text" : "password"}
                name="password"
                value={signupForm.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력해 주세요."
                autoComplete="new-password"
              />

              <button
                className={styles.passwordToggle}
                type="button"
                onClick={() => handlePasswordVisibility("password")}
                aria-label={
                  passwordVisibility.password
                    ? "비밀번호 숨기기"
                    : "비밀번호 표시하기"
                }
              >
                {passwordVisibility.password ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3L21 21" />
                    <path d="M10.6 10.6A2 2 0 0013.4 13.4" />
                    <path d="M9.9 4.2A10.7 10.7 0 0112 4c5.5 0 9 5 9 5a16.8 16.8 0 01-3 3.6" />
                    <path d="M6.2 6.2C4.1 7.6 3 9 3 9s3.5 5 9 5a9.8 9.8 0 003.2-.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                )}
              </button>
            </div>

            <div className={styles.passwordField}>
              <label
                className={styles.srOnly}
                htmlFor="signup-password-confirm"
              >
                비밀번호 확인
              </label>

              <input
                id="signup-password-confirm"
                className={styles.input}
                type={passwordVisibility.passwordConfirm ? "text" : "password"}
                name="passwordConfirm"
                value={signupForm.passwordConfirm}
                onChange={handleChange}
                placeholder="비밀번호를 다시 입력해 주세요."
                autoComplete="new-password"
              />

              <button
                className={styles.passwordToggle}
                type="button"
                onClick={() => handlePasswordVisibility("passwordConfirm")}
                aria-label={
                  passwordVisibility.passwordConfirm
                    ? "비밀번호 숨기기"
                    : "비밀번호 표시하기"
                }
              >
                {passwordVisibility.passwordConfirm ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3L21 21" />
                    <path d="M10.6 10.6A2 2 0 0013.4 13.4" />
                    <path d="M9.9 4.2A10.7 10.7 0 0112 4c5.5 0 9 5 9 5a16.8 16.8 0 01-3 3.6" />
                    <path d="M6.2 6.2C4.1 7.6 3 9 3 9s3.5 5 9 5a9.8 9.8 0 003.2-.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                )}
              </button>
            </div>

            {signupForm.passwordConfirm !== "" && !isPasswordMatched && (
              <p className={styles.errorMessage}>
                비밀번호가 일치하지 않습니다.
              </p>
            )}

            {signupError && (
              <p className={styles.errorMessage}>{signupError}</p>
            )}

            <button
              className={styles.submitButton}
              type="submit"
              disabled={!isSignupAvailable || isSubmitting}
            >
              {isSubmitting ? "가입 중..." : "회원가입"}
            </button>
          </form>

          <nav className={styles.accountMenu} aria-label="계정 메뉴">
            <Link to="/login">로그인</Link>

            <span className={styles.divider} aria-hidden="true" />

            <Link to="/find-password">비밀번호 찾기</Link>
          </nav>
        </div>
      </section>

      <FanPickDialog
        isOpen={isSuccessDialogOpen}
        title="회원가입 완료"
        description="FanPick 회원가입이 완료되었습니다."
        confirmText="로그인하기"
        onConfirm={handleSuccessConfirm}
        onClose={handleSuccessConfirm}
      />
    </>
  );
};

export default SignupPage;
