import css from "./PlayerRecord.module.css";

const PlayerRecord = ({ sections = [] }) => {
  const renderMetric = (metric) => (
    <li key={metric.label} className={css.metricItem}>
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
    </li>
  );

  return (
    <section className={css.playerRecord}>
      <header className={css.header}>
        <div>
          <p className={css.eyebrow}>PLAYER RECORD</p>
          <h3 className={css.title}>선수 기록</h3>
        </div>
        <p className={css.subtitle}>게임별로 선수 항목을 카드 형태로 확인</p>
      </header>

      <div className={css.sections}>
        {sections.map((section) => (
          <article key={section.title} className={css.sectionCard}>
            <div className={css.sectionHeader}>
              <div>
                <h4>{section.title}</h4>
                <p>{section.subtitle}</p>
              </div>
              <span>{section.items.length} PLAYERS</span>
            </div>

            <div className={css.cardGrid}>
              {section.items.map((player) => (
                <article key={player.id} className={css.playerCard}>
                  <div className={css.playerTop}>
                    <img
                      className={css.playerImage}
                      src={player.image || ""}
                      alt={player.displayName || "player"}
                    />

                    <div className={css.playerInfo}>
                      <p className={css.playerName}>{player.displayName}</p>
                      <p className={css.playerMeta}>
                        {player.position || "-"}
                      </p>
                    </div>
                  </div>

                  {player.tags?.length ? (
                    <ul className={css.tagList}>
                      {player.tags.slice(0, 3).map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  ) : null}

                  <ul className={css.metricList}>
                    {(player.metrics || []).map(renderMetric)}
                  </ul>
                </article>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default PlayerRecord;
