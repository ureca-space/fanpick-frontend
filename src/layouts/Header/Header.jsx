import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import CommunityNotifications from "../../components/CommunityNotifications/CommunityNotifications";
import FanPickDialog from "../../components/FanPickDialog/FanPickDialog";
import { LOGOUT_REDIRECT_STORAGE_KEY } from "../../constants/authFlow";
import useAuth from "../../contexts/useAuth";
import { supabase } from "../../lib/supabase";
import styles from "./Header.module.css";

const menuList = [
  {
    label: "TEAMS",
    path: "/teams",
    activePaths: ["/team-record"],
  },
  {
    label: "MATCH SCHEDULE",
    path: "/matches",
  },
  {
    label: "COMMUNITY",
    path: "/community",
  },
  {
    label: "PICK BATTLE",
    loginDescription: "픽 배틀에 참여하려면 먼저 로그인해 주세요.",
    path: "/worldcup",
    requiresAuth: true,
  },
];

const HEADER_SOLID_OFFSET = 72;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, isAuthLoading } = useAuth();
  const isHomePage = location.pathname === "/";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHomeHeaderSolid, setIsHomeHeaderSolid] = useState(!isHomePage);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loginDialogState, setLoginDialogState] = useState({
    description: "",
    from: null,
    isOpen: false,
  });

  useEffect(() => {
    if (!isHomePage) return undefined;

    const updateHeaderStyle = () => {
      const banner = document.querySelector("[data-main-banner]");
      const headerHeight = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--header-height",
        ),
      );
      const threshold = banner
        ? Math.max(
            0,
            banner.offsetHeight -
              (Number.isNaN(headerHeight) ? 0 : headerHeight) -
              HEADER_SOLID_OFFSET,
          )
        : 80;

      setIsHomeHeaderSolid(window.scrollY >= threshold);
    };

    const animationFrameId = window.requestAnimationFrame(updateHeaderStyle);
    window.addEventListener("scroll", updateHeaderStyle, { passive: true });
    window.addEventListener("resize", updateHeaderStyle);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", updateHeaderStyle);
      window.removeEventListener("resize", updateHeaderStyle);
    };
  }, [isHomePage]);

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

  const clearPendingLogoutRedirect = () => {
    window.sessionStorage.removeItem(LOGOUT_REDIRECT_STORAGE_KEY);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    closeMenu();
    closeLoginDialog();
    setIsLoggingOut(true);
    window.sessionStorage.setItem(LOGOUT_REDIRECT_STORAGE_KEY, "1");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        clearPendingLogoutRedirect();
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

      navigate("/", {
        replace: true,
        state: {
          authDialog: "logout",
        },
      });

      window.setTimeout(clearPendingLogoutRedirect, 1_000);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleMenuLinkClick = (event, menu) => {
    if (menu.requiresAuth && !isAuthLoading && !isLoggedIn) {
      event.preventDefault();
      closeMenu();
      setLoginDialogState({
        description:
          menu.loginDescription ?? "이 메뉴를 이용하려면 먼저 로그인해 주세요.",
        from: {
          pathname: menu.path,
        },
        isOpen: true,
      });
      return;
    }

    if (menu.requiresAuth && isAuthLoading) {
      event.preventDefault();
      return;
    }

    closeMenu();
  };

  const closeLoginDialog = () => {
    setLoginDialogState((previous) => ({
      ...previous,
      isOpen: false,
    }));
  };

  const handleMoveToLogin = () => {
    const from = loginDialogState.from;

    closeLoginDialog();

    navigate("/login", {
      state: {
        from,
      },
    });
  };

  const getNavLinkClass = ({ isActive }) =>
    `${styles.navLink} ${isActive ? styles.active : ""}`;

  const getMenuLinkClass = (menu, isActive) =>
    getNavLinkClass({
      isActive: isActive || menu.activePaths?.includes(location.pathname),
    });

  const renderAuthMenu = (isMobile = false) => {
    if (isAuthLoading) return null;

    const tabIndex = isMobile ? (isMenuOpen ? 0 : -1) : undefined;

    if (isLoggedIn) {
      return (
        <>
          <CommunityNotifications
            className={isMobile ? styles.mobileNotifications : ""}
            onNavigate={closeMenu}
            tabIndex={tabIndex}
            userId={user?.id}
          />

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
    <header
      className={`${styles.header} ${
        isHomePage && !isHomeHeaderSolid && !isMenuOpen
          ? styles.transparentHeader
          : ""
      }`}
    >
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
              className={({ isActive }) => getMenuLinkClass(menu, isActive)}
              onClick={(event) => handleMenuLinkClick(event, menu)}
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
              className={({ isActive }) => getMenuLinkClass(menu, isActive)}
              onClick={(event) => handleMenuLinkClick(event, menu)}
              tabIndex={isMenuOpen ? 0 : -1}
            >
              {menu.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.mobileAuthMenu}>{renderAuthMenu(true)}</div>
      </div>

      <FanPickDialog
        isOpen={loginDialogState.isOpen}
        title="로그인이 필요합니다"
        description={loginDialogState.description}
        confirmText="로그인하기"
        cancelText="취소"
        onClose={closeLoginDialog}
        onConfirm={handleMoveToLogin}
      />
    </header>
  );
};

export default Header;
