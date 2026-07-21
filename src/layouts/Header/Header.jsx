import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../contexts/useAuth";
import { supabase } from "../../lib/supabase";
import styles from "./Header.module.css";

const menuList = [
  {
    label: "TEAMS",
    path: "/teams",
  },
  {
    label: "MATCH SCHEDULE",
    path: "/matches",
  },
  {
    label: "CALENDAR",
    path: "/calendar",
  },
  {
    label: "PREDICTION",
    path: "/prediction",
  },
  {
    label: "PICK BATTLE",
    path: "/worldcup",
  },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, isAuthLoading } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogoClick = () => {
    closeMenu();

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("로그아웃 오류:", error);

        const currentPath = `${location.pathname}${location.search}${location.hash}`;

        navigate(currentPath, {
          replace: true,
          state: {
            ...location.state,
            authDialog: "logoutError",
          },
        });

        return;
      }

      closeMenu();

      navigate("/", {
        replace: true,
        state: {
          authDialog: "logout",
        },
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getNavLinkClass = ({ isActive }) =>
    `${styles.navLink} ${isActive ? styles.active : ""}`;

  const renderAuthMenu = (isMobile = false) => {
    if (isAuthLoading) return null;

    const tabIndex = isMobile ? (isMenuOpen ? 0 : -1) : undefined;

    if (isLoggedIn) {
      return (
        <>
          <NavLink
            to="/mypage"
            className={getNavLinkClass}
            onClick={closeMenu}
            tabIndex={tabIndex}
          >
            MY PAGE
          </NavLink>

          <span className={styles.divider} aria-hidden="true" />

          <button
            type="button"
            className={`${styles.navLink} ${styles.logoutButton}`}
            onClick={handleLogout}
            disabled={isLoggingOut}
            tabIndex={tabIndex}
          >
            {isLoggingOut ? "LOGGING OUT..." : "LOGOUT"}
          </button>
        </>
      );
    }

    return (
      <>
        <NavLink
          to="/login"
          className={getNavLinkClass}
          onClick={closeMenu}
          tabIndex={tabIndex}
        >
          LOGIN
        </NavLink>

        <span className={styles.divider} aria-hidden="true" />

        <NavLink
          to="/signup"
          className={getNavLinkClass}
          onClick={closeMenu}
          tabIndex={tabIndex}
        >
          JOIN US
        </NavLink>
      </>
    );
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link
          to="/"
          className={styles.logo}
          onClick={handleLogoClick}
          aria-label="FAN PICK 홈으로 이동"
        >
          <img src="/fanpick_logo.svg" alt="FanPick" />
        </Link>

        <nav className={styles.navigation} aria-label="스포츠 메뉴">
          {menuList.map((menu) => (
            <NavLink
              key={menu.path}
              to={menu.path}
              className={getNavLinkClass}
              onClick={closeMenu}
            >
              {menu.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.authMenu}>{renderAuthMenu()}</div>

        <button
          type="button"
          className={`${styles.menuButton} ${
            isMenuOpen ? styles.menuButtonOpen : ""
          }`}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "전체 메뉴 닫기" : "전체 메뉴 열기"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`${styles.mobileMenu} ${
          isMenuOpen ? styles.mobileMenuOpen : ""
        }`}
        aria-hidden={!isMenuOpen}
      >
        <nav
          className={styles.mobileNavigation}
          aria-label="모바일 스포츠 메뉴"
        >
          {menuList.map((menu) => (
            <NavLink
              key={menu.path}
              to={menu.path}
              className={getNavLinkClass}
              onClick={closeMenu}
              tabIndex={isMenuOpen ? 0 : -1}
            >
              {menu.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.mobileAuthMenu}>{renderAuthMenu(true)}</div>
      </div>
    </header>
  );
};

export default Header;
