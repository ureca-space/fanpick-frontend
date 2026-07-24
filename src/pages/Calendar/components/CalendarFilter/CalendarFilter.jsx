import css from "./CalendarFilter.module.css";

const CalendarFilter = ({
  selectedSport,
  isSupportedSport,
  loading,
  teamOptions,
  selectedTeamCode,
  onSelectTeamCode,
  savedMatches,
  onRemoveSavedMatch,
  formatMatchLabel,
}) => {
  return (
    <>
      <section className={css.teamFilterSection}>
        <div className={css.sectionHeadingRow}>
          <h2 className={css.sectionHeading}>TEAM FILTER</h2>
          <span className={css.sectionSubtext}>
            {selectedSport.toUpperCase()}
          </span>
        </div>

        {isSupportedSport ? (
          <>
            {loading && teamOptions.length === 0 ? (
              <p className={css.teamFilterEmpty}>팀 불러오는 중...</p>
            ) : null}

            {!loading && teamOptions.length === 0 ? (
              <p className={css.teamFilterEmpty}>팀 데이터가 없습니다.</p>
            ) : (
              <div className={css.teamFilterChips}>
                <button
                  type="button"
                  className={
                    selectedTeamCode === "all"
                      ? css.teamFilterChipActive
                      : css.teamFilterChip
                  }
                  onClick={() => onSelectTeamCode("all")}
                >
                  All
                </button>

                {teamOptions.map((team) => (
                  <button
                    key={team.code}
                    type="button"
                    aria-label={team.name || team.shortName || team.code}
                    className={
                      selectedTeamCode === team.code
                        ? css.teamFilterChipActive
                        : css.teamFilterChip
                    }
                    onClick={() => onSelectTeamCode(team.code)}
                  >
                    {team.logo ? (
                      <img
                        className={css.teamFilterChipLogo}
                        src={team.logo}
                        alt=""
                        aria-hidden="true"
                      />
                    ) : null}
                    <span className={css.teamFilterChipLabel}>
                      {team.shortName || team.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className={css.teamFilterEmpty}>
            eSports 팀 필터는 추후 추가 예정입니다.
          </p>
        )}
      </section>

      <section className={css.myMatchSection}>
        <div className={css.sectionHeadingRow}>
          <h2 className={css.sectionHeading}>MY MATCH LIST</h2>
        </div>

        {savedMatches.length > 0 ? (
          <ul className={css.myMatchList}>
            {savedMatches.map((match) => (
              <li key={match.id} className={css.myMatchItem}>
                <div className={css.myMatchInfo}>
                  <span className={css.myMatchSport}>{match.sportLabel}</span>
                  <span className={css.myMatchDate}>{match.date}</span>
                  <span className={css.myMatchLabel}>
                    {formatMatchLabel(match)}
                  </span>
                </div>

                <button
                  type="button"
                  className={css.myMatchRemoveButton}
                  aria-label={`${formatMatchLabel(match)} 제거`}
                  onClick={() => onRemoveSavedMatch(match.id)}
                >
                  X
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={css.myMatchEmpty}>저장된 경기가 없습니다.</p>
        )}
      </section>
    </>
  );
};

export default CalendarFilter;
