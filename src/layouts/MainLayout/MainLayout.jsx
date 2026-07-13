import { Outlet } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import styles from "./MainLayout.module.css";

const MainLayout = () => {
  return (
    <div className={styles.layout}>
      <Header />

      <div className={styles.content}>
        <Outlet />
      </div>

      <Footer />
    </div>
  );
};

export default MainLayout;
