import SubNav from "../../components/SubNav/SubNav";
import { MATCH_CENTER_SUB_NAV_ITEMS } from "../../constants/matchCenterNav";
import styles from "./CalendarPage.module.css";

const CalendarPage = () => {
  return (
    <>
      <SubNav
        activeItemId="calendar"
        ariaLabel="매치 센터 메뉴"
        items={MATCH_CENTER_SUB_NAV_ITEMS}
      />

      <section className={styles.page}>
        <div className={`container ${styles.inner}`}>
          <header className={styles.pageHeader}>
            <p className={styles.eyebrow}>FANPICK MATCH CENTER</p>
            <h1 className={styles.title}>CALENDAR</h1>
          </header>
        </div>
      </section>
    </>
  );
};
export default CalendarPage;
