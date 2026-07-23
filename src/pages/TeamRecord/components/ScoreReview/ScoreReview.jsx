import css from "./ScoreReview.module.css";

const ScoreReview = ({ team }) => {
  const ratings = team?.ratings || [];
  const average =
    ratings.length > 0
      ? (ratings.reduce((sum, rating) => sum + Number(rating.score || 0), 0) /
          ratings.length).toFixed(1)
      : "0.0";

  return (
    <section className={css.scoreReview}>
      <header className={css.header}>
        <div>
          <p className={css.eyebrow}>REVIEW</p>
          <h3 className={css.title}>전력</h3>
        </div>

        <p className={css.subtitle}>
          선택한 팀의 핵심 지표를 요약해서 보여줍니다.
        </p>
      </header>

      <div className={css.summaryCard}>
        <div className={css.summaryMain}>
          <span>AVERAGE</span>
          <strong>{average}</strong>
          <small>{team?.shortName || "-"}</small>
        </div>

        <div className={css.ratingGrid}>
          {ratings.map((rating) => (
            <div key={rating.label} className={css.ratingItem}>
              <span>{rating.label}</span>
              <strong>{rating.score}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScoreReview;
