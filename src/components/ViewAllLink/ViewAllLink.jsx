import { Link } from "react-router-dom";
import styles from "./ViewAllLink.module.css";

const ViewAllLink = ({ to, onClick, children = "VIEW ALL", className = "" }) => {
  const classNames = [styles.viewAllLink, className].filter(Boolean).join(" ");

  if (to) {
    return (
      <Link className={classNames} to={to}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classNames} onClick={onClick}>
      {children}
    </button>
  );
};

export default ViewAllLink;
