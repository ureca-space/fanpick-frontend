import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "../AuthPage.module.css";

const LoginPage = () => {
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isLoginAvailable =
    loginForm.username.trim() !== "" && loginForm.password.trim() !== "";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!isLoginAvailable) return;

    console.log("로그인 정보", loginForm);
  };

  return (
    <section className={styles.authPage}>
      <div className={styles.authContainer}>
        <h1 className={styles.title}>로그인</h1>

        <form className={styles.authForm} onSubmit={handleSubmit}>
          <label className={styles.srOnly} htmlFor="username">
            아이디
          </label>

          <input
            id="username"
            className={styles.input}
            type="text"
            name="username"
            value={loginForm.username}
            onChange={handleChange}
            placeholder="아이디를 입력해 주세요."
            autoComplete="username"
          />

          <div className={styles.passwordField}>
            <label className={styles.srOnly} htmlFor="password">
              비밀번호
            </label>

            <input
              id="password"
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

          <button
            className={styles.submitButton}
            type="submit"
            disabled={!isLoginAvailable}
          >
            로그인
          </button>
        </form>

        <nav className={styles.accountMenu} aria-label="계정 메뉴">
          <Link to="/signup">회원가입</Link>

          <span className={styles.divider} aria-hidden="true" />

          <Link to="/find-id">아이디 찾기</Link>

          <span className={styles.divider} aria-hidden="true" />

          <Link to="/find-password">비밀번호 찾기</Link>
        </nav>
      </div>
    </section>
  );
};

export default LoginPage;
