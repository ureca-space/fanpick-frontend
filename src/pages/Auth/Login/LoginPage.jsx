import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import styles from "../AuthPage.module.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const isLoginAvailable =
    loginForm.email.trim() !== "" && loginForm.password.trim() !== "";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setLoginError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isLoginAvailable || isSubmitting) return;

    setIsSubmitting(true);
    setLoginError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          setLoginError("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else {
          setLoginError(error.message);
        }

        return;
      }

      const previousLocation = location.state?.from;

      const redirectPath = previousLocation
        ? `${previousLocation.pathname ?? "/"}${
            previousLocation.search ?? ""
          }${previousLocation.hash ?? ""}`
        : "/";

      navigate(redirectPath, {
        replace: true,
        state: {
          authDialog: "login",
        },
      });
    } catch (error) {
      console.error("로그인 오류:", error);
      setLoginError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.authPage}>
      <div className={styles.authContainer}>
        <h1 className={styles.title}>로그인</h1>

        <form className={styles.authForm} onSubmit={handleSubmit}>
          <label className={styles.srOnly} htmlFor="login-email">
            이메일
          </label>

          <input
            id="login-email"
            className={styles.input}
            type="email"
            name="email"
            value={loginForm.email}
            onChange={handleChange}
            placeholder="이메일을 입력해 주세요."
            autoComplete="email"
          />

          <div className={styles.passwordField}>
            <label className={styles.srOnly} htmlFor="login-password">
              비밀번호
            </label>

            <input
              id="login-password"
              className={styles.input}
              type={isPasswordVisible ? "text" : "password"}
              name="password"
              value={loginForm.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력해 주세요."
              autoComplete="current-password"
            />

            <button
              className={styles.passwordToggle}
              type="button"
              onClick={() => setIsPasswordVisible((prev) => !prev)}
              aria-label={
                isPasswordVisible ? "비밀번호 숨기기" : "비밀번호 표시하기"
              }
            >
              {isPasswordVisible ? (
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

          {loginError && <p className={styles.errorMessage}>{loginError}</p>}

          <button
            className={styles.submitButton}
            type="submit"
            disabled={!isLoginAvailable || isSubmitting}
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <nav className={styles.accountMenu} aria-label="계정 메뉴">
          <Link to="/signup">회원가입</Link>

          <span className={styles.divider} aria-hidden="true" />

          <Link to="/find-password">비밀번호 찾기</Link>
        </nav>
      </div>
    </section>
  );
};

export default LoginPage;
