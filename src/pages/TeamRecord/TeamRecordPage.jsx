import { useMemo, useState } from "react";
import SearchInput from "../../components/SearchInput/SearchInput";
import PillTabs from "./components/PillTabs/PillTabs";
import RecordTable from "./components/RecordTable/RecordTable";
import { LOL_PLAYER_RECORDS } from "./data/lolPlayerRecordData";
import { LOL_TEAM_RECORDS } from "./data/lolTeamRecordData";
import {
  BASEBALL_HITTER_RECORDS,
  BASEBALL_HITTER_RECORDS_EXTRA,
  BASEBALL_PITCHER_RECORDS,
  BASEBALL_PITCHER_RECORDS_EXTRA,
  BASEBALL_TEAM_RECORDS,
  BASEBALL_TEAM_RECORDS_EXTRA,
} from "./data/kboRecordData";
import {
  SOCCER_PLAYER_RECORDS_K1,
  SOCCER_PLAYER_RECORDS_K2,
  SOCCER_TEAM_RECORDS_K1,
  SOCCER_TEAM_RECORDS_K2,
} from "./data/kleagueRecordData";
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

const SOCCER_LEAGUE_TABS = [
  { id: "k1", label: "K LEAGUE 1" },
  { id: "k2", label: "K LEAGUE 2" },
];

const formatPercent = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "-";
};

const formatDecimal = (value, digits = 2) => {
  const number = Number(value);

  return Number.isFinite(number) ? number.toFixed(digits).replace(/\.?0+$/, "") : "-";
};

const normalizeText = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "");

const matchesQuery = (query, fields = []) => {
  if (!query) {
    return true;
  }

  const normalizedQuery = normalizeText(query);

  return fields.some((field) => normalizeText(field).includes(normalizedQuery));
};

const getImageUrl = (...urls) => urls.find(Boolean) || "";

const getRankValue = (row) => row.rank ?? row.ranking ?? "-";

const collectTeamTabs = (rows = []) => {
  const seen = new Set();
  const tabs = [{ id: "all", label: "ALL" }];

  rows.forEach((row) => {
    if (!row.teamId || seen.has(row.teamId)) {
      return;
    }

    seen.add(row.teamId);

    tabs.push({
      id: row.teamId,
      label: row.teamShortName || row.teamName || row.teamId,
    });
  });

  return tabs;
};

const buildEsportsPlayerRows = (rows = []) => rows.map((row) => ({ ...row }));

const buildBaseballPlayerRows = () =>
  [...BASEBALL_HITTER_RECORDS, ...BASEBALL_PITCHER_RECORDS].map((row, index) => ({
    ...row,
    rank: index + 1,
    kind: index < BASEBALL_HITTER_RECORDS.length ? "HITTER" : "PITCHER",
  }));

const buildSoccerTeamRows = (leagueKey) =>
  (leagueKey === "k2" ? SOCCER_TEAM_RECORDS_K2 : SOCCER_TEAM_RECORDS_K1).map((row, index) => ({
    ...row,
    rank: row.rank ?? row.ranking ?? index + 1,
    logoUrl: getImageUrl(row.logoUrl, row.teamImageUrl, row.imageUrl),
  }));

const buildSoccerPlayerRows = (leagueKey) =>
  (leagueKey === "k2" ? SOCCER_PLAYER_RECORDS_K2 : SOCCER_PLAYER_RECORDS_K1).map((row, index) => ({
    ...row,
    rank: row.rank ?? row.ranking ?? index + 1,
    imageUrl: getImageUrl(row.imageUrl, row.playerImageUrl, row.image),
  }));

const getSearchFields = (row, sport, view) => {
  if (view === "team") {
    return [row.teamName, row.teamShortName, row.teamId];
  }

  if (sport === "esports") {
    return [row.playerName, row.playerFullName, row.teamName, row.teamShortName, row.position];
  }

  if (sport === "baseball") {
    return [row.playerName, row.teamName, row.teamShortName, row.position, row.kind];
  }

  return [row.playerName, row.teamName, row.teamShortName, row.position, row.backNumber];
};

const esportsTeamColumns = [
  {
    key: "rank",
    label: "Rank",
    align: "Center",
    render: (row) => <span className={styles.rankBadge}>{getRankValue(row)}</span>,
  },
  {
    key: "team",
    label: "Team",
    render: (row) => (
      <div className={styles.nameCell}>
        <img className={styles.logo} src={getImageUrl(row.imageUrl, row.logoUrl, row.teamImageUrl)} alt="" aria-hidden="true" />
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
  { key: "winRate", label: "Win %", align: "Center", render: (row) => formatPercent(row.winRate) },
  { key: "kda", label: "KDA", align: "Center" },
  { key: "kills", label: "Kills", align: "Center" },
  { key: "deaths", label: "Deaths", align: "Center" },
  { key: "assists", label: "Assists", align: "Center" },
  { key: "firstKillRate", label: "1st Kill", align: "Center", render: (row) => formatPercent(row.firstKillRate) },
  { key: "firstTowerRate", label: "1st Tower", align: "Center", render: (row) => formatPercent(row.firstTowerRate) },
  { key: "firstBaronRate", label: "1st Baron", align: "Center", render: (row) => formatPercent(row.firstBaronRate) },
  { key: "orderPoint", label: "Point", align: "Center" },
];

const esportsPlayerColumns = [
  {
    key: "rank",
    label: "Rank",
    align: "Center",
    render: (row) => <span className={styles.rankBadge}>{getRankValue(row)}</span>,
  },
  {
    key: "player",
    label: "Player",
    render: (row) => (
      <div className={styles.nameCell}>
        <img
          className={styles.avatar}
          src={getImageUrl(row.imageUrl, row.playerImageUrl, row.image)}
          alt=""
          aria-hidden="true"
        />
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
  { key: "winRate", label: "Win %", align: "Center", render: (row) => formatPercent(row.winRate) },
  { key: "kda", label: "KDA", align: "Center" },
  { key: "kills", label: "Kills", align: "Center" },
  { key: "deaths", label: "Deaths", align: "Center" },
  { key: "assists", label: "Assists", align: "Center" },
  { key: "killInvolveRate", label: "KI Rate", align: "Center", render: (row) => formatPercent(row.killInvolveRate) },
  { key: "competeSetCount", label: "Sets", align: "Center" },
  { key: "competeTimes", label: "Time", align: "Center" },
  { key: "pogPoint", label: "POG", align: "Center" },
];

const baseballTeamColumns = [
  {
    key: "rank",
    label: "Rank",
    align: "Center",
    render: (row) => <span className={styles.rankBadge}>{getRankValue(row)}</span>,
  },
  {
    key: "team",
    label: "Team",
    render: (row) => (
      <div className={styles.nameCell}>
        <img className={styles.logo} src={getImageUrl(row.logoUrl, row.imageUrl, row.teamImageUrl)} alt="" aria-hidden="true" />
        <div>
          <strong>{row.teamShortName}</strong>
          <span>{row.teamName}</span>
        </div>
      </div>
    ),
  },
  { key: "games", label: "G", align: "Center" },
  { key: "wins", label: "W", align: "Center" },
  { key: "draws", label: "D", align: "Center" },
  { key: "losses", label: "L", align: "Center" },
  { key: "winRate", label: "Win %", align: "Center", render: (row) => formatPercent(row.winRate) },
  { key: "runs", label: "Runs", align: "Center" },
  { key: "runsAllowed", label: "RA", align: "Center" },
  { key: "homeRuns", label: "HR", align: "Center" },
  { key: "era", label: "ERA", align: "Center", render: (row) => formatDecimal(row.era, 2) },
  { key: "lastFive", label: "Last 5", align: "Center" },
];

const baseballPlayerColumns = [
  {
    key: "rank",
    label: "Rank",
    align: "Center",
    render: (row) => <span className={styles.rankBadge}>{getRankValue(row)}</span>,
  },
  {
    key: "player",
    label: "Player",
    render: (row) => (
      <div className={styles.nameCell}>
        <img
          className={styles.avatar}
          src={getImageUrl(row.imageUrl, row.playerImageUrl, row.image)}
          alt=""
          aria-hidden="true"
        />
        <div>
          <strong>{row.playerName}</strong>
          <span>{row.position}</span>
        </div>
      </div>
    ),
  },
  { key: "teamShortName", label: "Team", align: "Center" },
  { key: "kind", label: "Type", align: "Center" },
  {
    key: "primary",
    label: "AVG / ERA",
    align: "Center",
    render: (row) => (row.kind === "HITTER" ? formatDecimal(row.avg, 3) : formatDecimal(row.era, 2)),
  },
  {
    key: "stat2",
    label: "HR / W",
    align: "Center",
    render: (row) => (row.kind === "HITTER" ? row.hr : row.wins),
  },
  {
    key: "stat3",
    label: "RBI / L",
    align: "Center",
    render: (row) => (row.kind === "HITTER" ? row.rbi : row.losses),
  },
  {
    key: "stat4",
    label: "OPS / WHIP",
    align: "Center",
    render: (row) => (row.kind === "HITTER" ? formatDecimal(row.ops, 3) : formatDecimal(row.whip, 2)),
  },
  {
    key: "stat5",
    label: "H / K",
    align: "Center",
    render: (row) => (row.kind === "HITTER" ? row.hits : row.strikeouts),
  },
  { key: "games", label: "G", align: "Center" },
];

const soccerTeamColumns = [
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
        <img className={styles.logo} src={row.logoUrl} alt="" aria-hidden="true" />
        <div>
          <strong>{row.teamShortName}</strong>
          <span>{row.teamName}</span>
        </div>
      </div>
    ),
  },
  { key: "matches", label: "M", align: "Center" },
  { key: "wins", label: "W", align: "Center" },
  { key: "draws", label: "D", align: "Center" },
  { key: "losses", label: "L", align: "Center" },
  { key: "goals", label: "GF", align: "Center" },
  { key: "conceded", label: "GA", align: "Center" },
  { key: "diff", label: "GD", align: "Center" },
  { key: "points", label: "Pts", align: "Center" },
  { key: "lastFive", label: "Last 5", align: "Center" },
];

const soccerPlayerColumns = [
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
          <span>{row.position}</span>
        </div>
      </div>
    ),
  },
  { key: "teamShortName", label: "Team", align: "Center" },
  { key: "matches", label: "M", align: "Center" },
  { key: "goals", label: "G", align: "Center" },
  { key: "assists", label: "A", align: "Center" },
  { key: "indexScore", label: "Score", align: "Center", render: (row) => formatDecimal(row.indexScore, 2) },
  { key: "shots", label: "Shots", align: "Center" },
  { key: "shotsOnTarget", label: "SOT", align: "Center" },
  { key: "minsPlayed", label: "Min", align: "Center" },
  { key: "yellowCards", label: "YC", align: "Center" },
];

const TeamRecordPage = () => {
  const [activeSport, setActiveSport] = useState("esports");
  const [activeView, setActiveView] = useState("team");
  const [activeSoccerLeague, setActiveSoccerLeague] = useState("k1");
  const [activeTeam, setActiveTeam] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const baseRows = useMemo(() => {
    if (activeSport === "esports") {
      return activeView === "team" ? LOL_TEAM_RECORDS : buildEsportsPlayerRows(LOL_PLAYER_RECORDS);
    }

    if (activeSport === "baseball") {
      if (activeView === "team") {
        return [...BASEBALL_TEAM_RECORDS, ...BASEBALL_TEAM_RECORDS_EXTRA];
      }

      return [
        ...buildBaseballPlayerRows(),
        ...BASEBALL_HITTER_RECORDS_EXTRA.map((row, index) => ({
          ...row,
          rank: BASEBALL_HITTER_RECORDS.length + index + 1,
          kind: "HITTER",
        })),
        ...BASEBALL_PITCHER_RECORDS_EXTRA.map((row, index) => ({
          ...row,
          rank: BASEBALL_HITTER_RECORDS.length + BASEBALL_HITTER_RECORDS_EXTRA.length + index + 1,
          kind: "PITCHER",
        })),
      ];
    }

    if (activeView === "team") {
      return buildSoccerTeamRows(activeSoccerLeague);
    }

    return buildSoccerPlayerRows(activeSoccerLeague);
  }, [activeSport, activeView, activeSoccerLeague]);

  const teamTabs = useMemo(
    () => (activeView === "player" ? collectTeamTabs(baseRows) : []),
    [activeView, baseRows],
  );

  const visibleRows = useMemo(() => {
    const teamFilteredRows =
      activeTeam === "all" ? baseRows : baseRows.filter((row) => row.teamId === activeTeam);

    if (!searchTerm.trim()) {
      return teamFilteredRows;
    }

    return teamFilteredRows.filter((row) => matchesQuery(searchTerm, getSearchFields(row, activeSport, activeView)));
  }, [activeTeam, activeView, activeSport, baseRows, searchTerm]);

  const activeColumns = useMemo(() => {
    if (activeSport === "esports") {
      return activeView === "team" ? esportsTeamColumns : esportsPlayerColumns;
    }

    if (activeSport === "baseball") {
      return activeView === "team" ? baseballTeamColumns : baseballPlayerColumns;
    }

    return activeView === "team" ? soccerTeamColumns : soccerPlayerColumns;
  }, [activeSport, activeView]);

  const sectionTitle = {
    esports: {
      team: "LOL TEAM RECORD",
      player: "LOL PLAYER RECORD",
    },
    baseball: {
      team: "BASEBALL TEAM RECORD",
      player: "BASEBALL PLAYER RECORD",
    },
    soccer: {
      team:
        activeSoccerLeague === "k2"
          ? "SOCCER K LEAGUE 2 TEAM RECORD"
          : "SOCCER K LEAGUE 1 TEAM RECORD",
      player:
        activeSoccerLeague === "k2"
          ? "SOCCER K LEAGUE 2 PLAYER RECORD"
          : "SOCCER K LEAGUE 1 PLAYER RECORD",
    },
  }[activeSport][activeView];

  const sectionMeta = {
    esports: "LCK mock data",
    baseball: "KBO season records from the attached dataset",
    soccer:
      activeSoccerLeague === "k2"
        ? "K League 2 season records from the attached dataset"
        : "K League 1 season records from the attached dataset",
  }[activeSport];

  const sportLabel = {
    esports: "LOL",
    baseball: "BASEBALL",
    soccer: activeSoccerLeague === "k2" ? "SOCCER / K LEAGUE 2" : "SOCCER / K LEAGUE 1",
  }[activeSport];

  const handleSportChange = (nextSport) => {
    setActiveSport(nextSport);
    setActiveView("team");
    setActiveSoccerLeague("k1");
    setActiveTeam("all");
    setSearchTerm("");
  };

  const handleViewChange = (nextView) => {
    setActiveView(nextView);
    setActiveTeam("all");
    setSearchTerm("");
  };

  const handleSoccerLeagueChange = (nextLeague) => {
    setActiveSoccerLeague(nextLeague);
    setActiveTeam("all");
    setSearchTerm("");
  };

  return (
    <main className={styles.page}>
      <div className="container">
        <header className={styles.hero}>
          <p className={styles.eyebrow}>TEAM RECORD</p>
          <h1 className={styles.title}>RECORD TABLE</h1>
          <p className={styles.subtitle}>
            종목별, 팀별, 선수별 기록을 확인해보세요.
          </p>
        </header>

        <section className={styles.controlSection} aria-label="record controls">
          <div className={styles.controlBlock}>
            <span className={styles.controlLabel}>SPORT</span>
            <PillTabs
              tabs={SPORT_TABS}
              activeId={activeSport}
              onChange={handleSportChange}
              ariaLabel="sport tabs"
              variant="filter"
            />
          </div>

          {activeSport === "soccer" ? (
            <div className={styles.controlBlock}>
              <span className={styles.controlLabel}>LEAGUE</span>
              <PillTabs
                tabs={SOCCER_LEAGUE_TABS}
                activeId={activeSoccerLeague}
                onChange={handleSoccerLeagueChange}
                ariaLabel="soccer league tabs"
                variant="filter"
              />
            </div>
          ) : null}

          <div className={styles.controlBlock}>
            <span className={styles.controlLabel}>VIEW</span>
            <PillTabs
              tabs={VIEW_TABS}
              activeId={activeView}
              onChange={handleViewChange}
              ariaLabel="record table tabs"
              variant="calendar"
            />
          </div>

          {activeView === "player" ? (
            <div className={styles.controlBlock}>
              <span className={styles.controlLabel}>TEAM</span>
              <PillTabs
                tabs={teamTabs}
                activeId={activeTeam}
                onChange={setActiveTeam}
                ariaLabel="team tabs"
                variant="calendar"
              />
            </div>
          ) : null}

          <div className={styles.controlBlock}>
            <span className={styles.controlLabel}>SEARCH</span>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="팀명, 선수명 검색"
              ariaLabel="team record search"
              debounceDelay={250}
            />
          </div>
        </section>

        <section className={styles.section} data-sport={activeSport}>
          <div className={styles.sectionBadge}>{sportLabel}</div>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
              <p className={styles.sectionMeta}>{sectionMeta}</p>
            </div>
            <p className={styles.sectionCount}>{visibleRows.length.toLocaleString("en-US")} ROWS</p>
          </div>

          <RecordTable
            key={`${activeSport}-${activeView}-${activeSoccerLeague}`}
            columns={activeColumns}
            rows={visibleRows}
            getRowKey={(row) => row.playerId || row.teamId || row.id}
            ariaLabel={`${activeSport} ${activeView} record table`}
          />
        </section>
      </div>
    </main>
  );
};

export default TeamRecordPage;
