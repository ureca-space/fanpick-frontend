import { Outlet } from "react-router-dom";
import Header from "../Header/Header.jsx";
import Footer from "../Footer/Footer.jsx";
import TopButton from "../../components/TopButton/TopButton.jsx";
import styles from "./MainLayout.module.css";

const MainLayout = () => {
  return (
    <div className={styles.layout}>
      <Header />

      <main className={styles.content}>
        <Outlet />
      </main>

      <Footer />
      <TopButton />
    </div>
  );
};

export default MainLayout;
