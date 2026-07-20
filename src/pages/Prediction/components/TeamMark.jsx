import styles from "../PredictionPage.module.css";

// - 팀 로고가 있으면 이미지 표시
// - 팀 로고가 없으면 팀 이름의 첫 글자 표시
const TeamMark = ({ team }) =>
  team.logo ? (
    <img
      className={styles.teamLogo}
      src={team.logo}
      alt={`${team.name} 로고`}
    />
  ) : (
    <span className={styles.teamMark} aria-hidden="true">
      {team.shortName}
    </span>
  );

export default TeamMark;
