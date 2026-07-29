import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import FanPickDialog from "../FanPickDialog/FanPickDialog";
import useAuth from "../../contexts/useAuth";
import styles from "./SubNav.module.css";

const joinClassNames = (...classNames) => classNames.filter(Boolean).join(" ");

const SubNav = ({ activeItemId = "", ariaLabel = "서브 메뉴", items, onItemClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, isAuthLoading } = useAuth();
  const [loginDialogState, setLoginDialogState] = useState({
    description: "",
    from: null,
    isOpen: false,
  });

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

  const handleItemClick = (item) => {
    if (item.to) {
      if (item.requiresAuth && !isAuthLoading && !isLoggedIn) {
        setLoginDialogState({
          description:
            item.loginDescription ?? "이 메뉴를 이용하려면 먼저 로그인해 주세요.",
          from: {
            pathname: item.to,
          },
          isOpen: true,
        });
        return;
      }

      navigate(item.to);
      return;
    }

    onItemClick?.(item.id);
  };

  return (
    <>
      <nav className={styles.subNav} aria-label={ariaLabel}>
        <div className={styles.inner}>
          <div className={styles.menuScroller}>
            <ul className={styles.menuList}>
              {items.map((item) => {
                const isActive = activeItemId
                  ? item.id === activeItemId
                  : item.to === location.pathname;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={joinClassNames(
                        styles.menuLink,
                        isActive ? styles.active : "",
                      )}
                      onClick={() => handleItemClick(item)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>

      <FanPickDialog
        isOpen={loginDialogState.isOpen}
        title="로그인이 필요합니다"
        description={loginDialogState.description}
        confirmText="로그인하기"
        cancelText="취소"
        onClose={closeLoginDialog}
        onConfirm={handleMoveToLogin}
      />
    </>
  );
};

export default SubNav;
