import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import styles from "./Header.module.css";

const menuList = [
  {
    label: "BASEBALL",
    path: "/sports/baseball",
  },
  {
    label: "SOCCER",
    path: "/sports/football",
  },
  {
    label: "BASKETBALL",
    path: "/sports/basketball",
  },
  {
    label: "LOL",
    path: "/sports/lol",
  },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const getNavLinkClass = ({ isActive }) =>
    `${styles.navLink} ${isActive ? styles.active : ""}`;

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link
          to="/"
          className={styles.logo}
          onClick={handleLogoClick}
          aria-label="FAN PICK 홈으로 이동"
        >
          <img src="/logos/fanpick_logo.svg" alt="FanPick" />
        </Link>

        {/* 데스크톱 스포츠 메뉴 */}
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

        {/* 데스크톱 회원 메뉴 */}
        <div className={styles.authMenu}>
          <NavLink to="/login" className={getNavLinkClass} onClick={closeMenu}>
            LOGIN
          </NavLink>

          <span className={styles.divider} aria-hidden="true" />

          <NavLink to="/signup" className={getNavLinkClass} onClick={closeMenu}>
            JOIN US
          </NavLink>
        </div>

        {/* 모바일 햄버거 버튼 */}
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

      {/* 모바일 드롭다운 메뉴 */}
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

        <div className={styles.mobileAuthMenu}>
          <NavLink
            to="/login"
            className={getNavLinkClass}
            onClick={closeMenu}
            tabIndex={isMenuOpen ? 0 : -1}
          >
            LOGIN
          </NavLink>

          <span className={styles.divider} aria-hidden="true" />

          <NavLink
            to="/signup"
            className={getNavLinkClass}
            onClick={closeMenu}
            tabIndex={isMenuOpen ? 0 : -1}
          >
            JOIN US
          </NavLink>
        </div>
      </div>
    </header>
  );
};

export default Header;
