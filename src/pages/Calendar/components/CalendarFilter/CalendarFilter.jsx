import Skeleton from "../../../../components/Skeleton/Skeleton";
import css from "./CalendarFilter.module.css";

const CalendarFilter = ({
  selectedSport,
  isSupportedSport,
  loading,
  teamOptions,
  selectedTeamCode,
  onSelectTeamCode,
  emptyMessage = "팀 데이터가 없습니다.",
}) => {
  return (
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
            <div className={css.teamFilterSkeleton}>
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className={css.teamFilterSkeletonChip}>
                  <Skeleton.Circle className={css.teamFilterSkeletonLogo} />
                  <Skeleton.Line className={css.teamFilterSkeletonLabel} />
                </div>
              ))}
            </div>
          ) : !loading && teamOptions.length === 0 ? (
            <p className={css.teamFilterEmpty}>{emptyMessage}</p>
          ) : (
            <div className={css.teamFilterChips}>
              {teamOptions.map((team) => (
                <button
                  key={team.code}
                  type="button"
                  aria-label={team.name || team.shortName || team.code}
                  aria-pressed={selectedTeamCode === team.code}
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
  );
};

export default CalendarFilter;
