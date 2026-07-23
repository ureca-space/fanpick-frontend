import css from "./LineUp.module.css";

const LineUp = ({ home = {}, away = {} }) => {
  const renderPlayer = (player) => (
    <li key={`${player.id}-${player.battingOrder}`} className={css.playerCard}>
      <div className={css.playerOrder}>{player.battingOrder || "-"}</div>

      <div className={css.playerProfile}>
        <img
          className={css.playerImage}
          src={player.image || ""}
          alt={player.displayName || "player"}
        />

        <div className={css.playerInfo}>
          <p className={css.playerName}>{player.displayName}</p>
          <p className={css.playerMeta}>
            {player.position || "-"} | {player.role || "-"} | {player.hand || "-"}
          </p>
        </div>
      </div>

      <div className={css.statList}>
        {(player.statRows || []).map((stat) => (
          <div key={`${player.id}-${stat.label}`} className={css.statRow}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>
    </li>
  );

  return (
    <section className={css.lineUp}>
      <header className={css.header}>
        <div>
          <p className={css.eyebrow}>LINEUP</p>
          <h3 className={css.title}>라인업</h3>
        </div>
        <p className={css.subtitle}>팀 멤버를 기준으로 비교 라인업을 보여줍니다.</p>
      </header>

      <div className={css.columns}>
        <article className={css.teamPanel}>
          <div className={css.teamHeader}>
            <span>{home.teamLabel || "HOME"}</span>
            <strong>{home.players?.length || 0} PLAYERS</strong>
          </div>

          <ul className={css.playerList}>
            {(home.players || []).map(renderPlayer)}
          </ul>
        </article>

        <article className={css.teamPanel}>
          <div className={css.teamHeader}>
            <span>{away.teamLabel || "AWAY"}</span>
            <strong>{away.players?.length || 0} PLAYERS</strong>
          </div>

          <ul className={css.playerList}>
            {(away.players || []).map(renderPlayer)}
          </ul>
        </article>
      </div>
    </section>
  );
};

export default LineUp;
