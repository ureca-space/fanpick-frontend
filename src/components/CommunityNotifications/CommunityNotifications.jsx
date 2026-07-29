import { useCallback, useEffect, useRef, useState } from "react";
import { FiBell, FiCheck } from "react-icons/fi";
import { Link } from "react-router";
import {
  fetchCommunityNotifications,
  markAllCommunityNotificationsRead,
  markCommunityNotificationRead,
  subscribeToCommunityNotificationChanges,
} from "../../services/communityNotifications";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import useRelativeTimeClock from "../../hooks/useRelativeTimeClock";
import styles from "./CommunityNotifications.module.css";

const MAX_VISIBLE_UNREAD_COUNT = 99;

const CommunityNotifications = ({
  className = "",
  onNavigate,
  tabIndex,
  userId,
}) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const currentTime = useRelativeTimeClock();
  const rootRef = useRef(null);

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const badgeLabel =
    unreadCount > MAX_VISIBLE_UNREAD_COUNT
      ? `${MAX_VISIBLE_UNREAD_COUNT}+`
      : String(unreadCount);

  const loadNotifications = useCallback(
    async ({ showLoading = false } = {}) => {
      if (!userId) {
        setNotifications([]);
        return;
      }

      try {
        if (showLoading) {
          setIsLoading(true);
        }

        setNotifications(await fetchCommunityNotifications(userId));
      } catch (error) {
        console.error("커뮤니티 알림 조회 오류:", error);
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [userId],
  );

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadNotifications({ showLoading: true });
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [loadNotifications]);

  useEffect(() => {
    const unsubscribe = subscribeToCommunityNotificationChanges({
      userId,
      onChange: () => loadNotifications(),
    });

    return unsubscribe;
  }, [loadNotifications, userId]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const togglePanel = () => {
    setIsOpen((previous) => !previous);
  };

  const handleNotificationClick = async (notification) => {
    setIsOpen(false);
    onNavigate?.();

    if (notification.isRead) return;

    setNotifications((currentNotifications) =>
      currentNotifications.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item,
      ),
    );

    try {
      await markCommunityNotificationRead(notification.id, userId);
    } catch (error) {
      console.error("커뮤니티 알림 읽음 처리 오류:", error);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    setNotifications((currentNotifications) =>
      currentNotifications.map((item) => ({ ...item, isRead: true })),
    );

    try {
      await markAllCommunityNotificationsRead(userId);
    } catch (error) {
      console.error("커뮤니티 알림 전체 읽음 처리 오류:", error);
    }
  };

  return (
    <div
      className={[styles.notificationRoot, className].filter(Boolean).join(" ")}
      ref={rootRef}
    >
      <button
        type="button"
        className={styles.notificationButton}
        onClick={togglePanel}
        aria-label={`커뮤니티 알림 ${unreadCount}개`}
        aria-expanded={isOpen}
        tabIndex={tabIndex}
      >
        <FiBell aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className={styles.notificationBadge}>{badgeLabel}</span>
        ) : null}
      </button>

      {isOpen ? (
        <section className={styles.notificationPanel} aria-label="커뮤니티 알림">
          <header className={styles.notificationHeader}>
            <h2>알림</h2>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              <FiCheck aria-hidden="true" />
              모두 읽음
            </button>
          </header>

          {isLoading ? (
            <p className={styles.notificationStatus}>알림을 불러오는 중입니다.</p>
          ) : notifications.length === 0 ? (
            <p className={styles.notificationStatus}>새 알림이 없습니다.</p>
          ) : (
            <ul className={styles.notificationList}>
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    to={`/community/${notification.postId}`}
                    className={[
                      styles.notificationItem,
                      notification.isRead ? "" : styles.notificationItemUnread,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                    <small>
                      {formatRelativeTime(notification.createdAt, currentTime)}
                    </small>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
};

export default CommunityNotifications;
