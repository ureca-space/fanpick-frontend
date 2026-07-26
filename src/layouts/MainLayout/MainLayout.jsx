import { Outlet, useLocation, useNavigate } from "react-router-dom";
import FanPickDialog from "../../components/FanPickDialog/FanPickDialog.jsx";
import AiReportWidget from "../../components/AiReportWidget/AiReportWidget.jsx";
import TopButton from "../../components/TopButton/TopButton.jsx";
import Footer from "../Footer/Footer.jsx";
import Header from "../Header/Header.jsx";
import styles from "./MainLayout.module.css";

const DIALOG_CONTENT = {
  login: {
    title: "로그인 완료",
    description: "FanPick에 로그인되었습니다.",
    confirmText: "확인",
  },
  logout: {
    title: "로그아웃 완료",
    description: "정상적으로 로그아웃되었습니다.",
    confirmText: "확인",
  },
  logoutError: {
    title: "로그아웃 실패",
    description: "로그아웃 중 오류가 발생했습니다. 다시 시도해 주세요.",
    confirmText: "확인",
  },
};

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const dialogType = location.state?.authDialog;
  const dialogContent = DIALOG_CONTENT[dialogType];

  const handleCloseDialog = () => {
    const currentPath = `${location.pathname}${location.search}${location.hash}`;

    const remainingState = { ...(location.state ?? {}) };
    delete remainingState.authDialog;

    navigate(currentPath, {
      replace: true,
      state: Object.keys(remainingState).length > 0 ? remainingState : null,
    });
  };

  return (
    <div className={styles.layout}>
      <Header />

      <main className={styles.content}>
        <Outlet />
      </main>

      <Footer />

      <TopButton />
      <AiReportWidget />

      <FanPickDialog
        isOpen={Boolean(dialogContent)}
        title={dialogContent?.title ?? ""}
        description={dialogContent?.description ?? ""}
        confirmText={dialogContent?.confirmText ?? "확인"}
        onConfirm={handleCloseDialog}
        onClose={handleCloseDialog}
      />
    </div>
  );
};

export default MainLayout;
