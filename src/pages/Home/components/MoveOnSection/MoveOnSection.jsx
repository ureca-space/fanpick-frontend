import { useEffect, useRef, useState } from "react";
import styles from "./MoveOnSection.module.css";

const MoveOnSection = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setIsVisible(true);
        observer.disconnect();
      },
      {
        threshold: 0.35,
      },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.moveOnSection}>
      <h2 className={`${styles.title} ${isVisible ? styles.visible : ""}`}>
        <span className={styles.timeTo}>MAKE</span>
        <span className={styles.moveOn}>YOUR PICK</span>
      </h2>
    </section>
  );
};

export default MoveOnSection;
