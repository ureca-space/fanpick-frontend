import { useMemo, useState } from "react";
import RecordTable from "./components/RecordTable/RecordTable";
import PillTabs from "./components/PillTabs/PillTabs";
import { PLAYER_RECORDS, TEAM_RECORDS } from "./data/teamRecordMock";
import styles from "./TeamRecordPage.module.css";

const SPORT_TABS = [
  { id: "esports", label: "LOL" },
  { id: "baseball", label: "BASEBALL" },
  { id: "soccer", label: "SOCCER" },
];

const VIEW_TABS = [
  { id: "team", label: "TEAM" },
  { id: "player", label: "PLAYER" },
];

const RECORD_DATA = {
  esports: {
    team: TEAM_RECORDS,
    player: PLAYER_RECORDS,
  },
  baseball: {
    team: [],
    player: [],
  },
  soccer: {
    team: [],
    player: [],
  },
};

const teamColumns = [
  {
    key: "rank",
    label: "Rank",
    align: "Center",
    render: (row) => <span className={styles.rankBadge}>{row.rank}</span>,
  },
  {
    key: "team",
    label: "Team",
    render: (row) => (
      <div className={styles.nameCell}>
        <img className={styles.logo} src={row.imageUrl} alt="" aria-hidden="true" />
        <div>
          <strong>{row.teamShortName}</strong>
          <span>{row.teamName}</span>
        </div>
      </div>
    ),
  },
  { key: "wins", label: "W", align: "Center" },
  { key: "loses", label: "L", align: "Center" },
  { key: "score", label: "Score", align: "Center" },
  {
    key: "winRate",
    label: "Win %",
    align: "Center",
    render: (row) => `${Math.round(row.winRate * 100)}%`,
  },
  { key: "kda", label: "KDA", align: "Center" },
  { key: "kills", label: "Kills", align: "Center" },
  { key: "deaths", label: "Deaths", align: "Center" },
  { key: "assists", label: "Assists", align: "Center" },
  {
    key: "firstKillRate",
    label: "1st Kill",
    align: "Center",
    render: (row) => `${Math.round(row.firstKillRate * 100)}%`,
  },
  {
    key: "firstTowerRate",
    label: "1st Tower",
    align: "Center",
    render: (row) => `${Math.round(row.firstTowerRate * 100)}%`,
  },
  {
    key: "firstBaronRate",
    label: "1st Baron",
    align: "Center",
    render: (row) => `${Math.round(row.firstBaronRate * 100)}%`,
  },
  { key: "orderPoint", label: "Point", align: "Center" },
];

const playerColumns = [
  {
    key: "rank",
    label: "Rank",
    align: "Center",
    render: (row) => <span className={styles.rankBadge}>{row.rank}</span>,
  },
  {
    key: "player",
    label: "Player",
    render: (row) => (
      <div className={styles.nameCell}>
        <img className={styles.avatar} src={row.imageUrl} alt="" aria-hidden="true" />
        <div>
          <strong>{row.playerName}</strong>
          <span>{row.playerFullName}</span>
        </div>
      </div>
    ),
  },
  { key: "position", label: "Pos", align: "Center" },
  { key: "teamShortName", label: "Team", align: "Center" },
  { key: "wins", label: "W", align: "Center" },
  { key: "loses", label: "L", align: "Center" },
  { key: "score", label: "Score", align: "Center" },
  {
    key: "winRate",
    label: "Win %",
    align: "Center",
    render: (row) => `${Math.round(row.winRate * 100)}%`,
  },
  { key: "kda", label: "KDA", align: "Center" },
  { key: "kills", label: "Kills", align: "Center" },
  { key: "deaths", label: "Deaths", align: "Center" },
  { key: "assists", label: "Assists", align: "Center" },
  {
    key: "killInvolveRate",
    label: "KI Rate",
    align: "Center",
    render: (row) => `${Math.round(row.killInvolveRate * 100)}%`,
  },
  { key: "competeSetCount", label: "Sets", align: "Center" },
  { key: "competeTimes", label: "Time", align: "Center" },
  { key: "pogPoint", label: "POG", align: "Center" },
];

const TeamRecordPage = () => {
  const [activeSport, setActiveSport] = useState("esports");
  const [activeView, setActiveView] = useState("team");

  const activeData = RECORD_DATA[activeSport] ?? RECORD_DATA.esports;

  const visibleRows = useMemo(() => {
    return activeData[activeView] ?? [];
  }, [activeData, activeView]);

  const isEmpty = visibleRows.length === 0;

  return (
    <main className={styles.page}>
      <div className="container">
        <header className={styles.hero}>
          <p className={styles.eyebrow}>TEAM RECORD</p>
          <h1 className={styles.title}>RECORD TABLE</h1>
        </header>

        <section className={styles.controlSection} aria-label="record controls">
          <div className={styles.controlBlock}>
            <PillTabs
              tabs={SPORT_TABS}
              activeId={activeSport}
              onChange={setActiveSport}
              ariaLabel="sport tabs"
              variant="filter"
            />
          </div>

          <div className={styles.controlBlock}>
            <PillTabs
              tabs={VIEW_TABS}
              activeId={activeView}
              onChange={setActiveView}
              ariaLabel="record table tabs"
              variant="calendar"
            />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                {activeView === "team" ? "Team Record" : "Player Record"}
              </h2>
            </div>
            <p className={styles.sectionMeta}>
              {activeSport === "esports"
                ? "LCK 2026 regular season mock data"
                : "Data will be connected later"}
            </p>
          </div>

          {isEmpty ? (
            <div className={styles.emptyState}>
              <strong>Data coming soon</strong>
              <p>
                Records for the selected sport and tab will appear here once the
                data is connected.
              </p>
            </div>
          ) : (
            <RecordTable
              columns={activeView === "team" ? teamColumns : playerColumns}
              rows={visibleRows}
              getRowKey={(row) => (activeView === "team" ? row.teamId : row.playerId)}
              ariaLabel={`${activeView} record table`}
            />
          )}
        </section>
      </div>
    </main>
  );
};

export default TeamRecordPage;
