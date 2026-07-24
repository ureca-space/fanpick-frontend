import { useEffect, useMemo, useState } from "react";
import MatchFilter from "../../components/MatchFilter/MatchFilter";
import SearchInput from "../../components/SearchInput/SearchInput";
import SubNav from "../../components/SubNav/SubNav";
import { TEAMS_SUB_NAV_ITEMS } from "../../constants/teamsNav";
import { getTeamInfo } from "../../constants/teamInfo";
import {
  fetchPlayerRecords,
  fetchTeamRecords,
  subscribeTeamRecords,
} from "../../services/teamRecords";
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

const LCK_TEAM_IDS = new Set(LOL_TEAM_RECORDS.map((team) => team.teamId));

const getRecordLeagueId = (sport, soccerLeague) => {
  if (sport === "baseball") {
    return "kbo";
  }

  if (sport === "esports") {
    return "lck";
  }

  return soccerLeague === "k2" ? "kleague2" : "kleague1";
};

const getRecordDatasetKey = (sport, view, leagueId) => `${sport}:${view}:${leagueId}`;

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

const FALLBACK_IMAGE_URL = "/fanpick_logo.svg";

const BROKEN_IMAGE_URLS = new Set([
  "https://sports-phinf.pstatic.net/player/kfootball/default/20190178.png",
  "https://sports-phinf.pstatic.net/player/kfootball/default/20230255.png",
  "https://sports-phinf.pstatic.net/player/kfootball/default/20210155.png",
  "https://sports-phinf.pstatic.net/player/kfootball/default/20250166.png",
  "https://sports-phinf.pstatic.net/player/kfootball/default/20260332.png",
  "https://sports-phinf.pstatic.net/player/kfootball/default/20260282.png",
  "https://sports-phinf.pstatic.net/player/kfootball/default/20260284.png",
  "hhttps://ssl.pstatic.net/sstatic/people/profileImg/t/7e68a7dd-43e8-4cca-9540-dda3e777f7d2.png",
]);

const isValidImageUrl = (url) =>
  typeof url === "string" &&
  (/^https?:\/\//.test(url) || url.startsWith("/")) &&
  !BROKEN_IMAGE_URLS.has(url);

const getImageUrl = (...urls) => urls.find(isValidImageUrl) || FALLBACK_IMAGE_URL;

const getSoccerTeamCode = (teamId) => {
  const normalizedTeamId = String(teamId ?? "").trim().toUpperCase();

  if (!normalizedTeamId) {
    return "";
  }

  return normalizedTeamId.startsWith("K")
    ? normalizedTeamId
    : `K${normalizedTeamId.padStart(2, "0")}`;
};

const getSoccerTeamLogoUrl = (row) => {
  const teamInfo = getTeamInfo(getSoccerTeamCode(row.teamId), "soccer");

  return getImageUrl(teamInfo.logo, row.logoUrl, row.teamImageUrl, row.imageUrl);
};

const uniqueBy = (rows = [], getKey) => {
  const seen = new Set();

  return rows.filter((row) => {
    const key = getKey(row);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const TeamRecordImage = ({
  src,
  className,
  alt = "",
  fallbackSrc = FALLBACK_IMAGE_URL,
}) => {
  const [failedSrc, setFailedSrc] = useState("");
  const resolvedSrc = src || fallbackSrc;
  const isFallback =
    !src || resolvedSrc === fallbackSrc || failedSrc === resolvedSrc;
  const imageSrc = isFallback ? fallbackSrc : resolvedSrc;

  return (
    <img
      className={[className, isFallback ? styles.fallbackImage : ""]
        .filter(Boolean)
        .join(" ")}
      src={imageSrc}
      alt={alt}
      aria-hidden="true"
      onError={() => {
        if (imageSrc !== fallbackSrc) {
          setFailedSrc(resolvedSrc);
        }
      }}
    />
  );
};

const getRankValue = (row) => row.rank ?? row.ranking ?? "-";

const getRecordRowKey = (row, activeSport, activeView) => {
  const rank = row.rank ?? row.ranking ?? "";

  if (activeView === "player") {
    return [
      activeSport,
      row.teamId,
      row.playerId,
      row.playerName,
      row.playerFullName,
      rank,
    ]
      .filter(Boolean)
      .join(":");
  }

  return [activeSport, row.teamId, row.id, row.teamName, rank]
    .filter(Boolean)
    .join(":");
};

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

const buildEsportsPlayerRows = (rows = []) =>
  rows
    .filter((row) => LCK_TEAM_IDS.has(row.teamId))
    .map((row) => ({ ...row }));

const getEsportsPlayerDisplayName = (row) => row.playerFullName || row.playerName;

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
    logoUrl: getSoccerTeamLogoUrl(row),
  }));

const buildSoccerPlayerRows = (leagueKey) =>
  uniqueBy(leagueKey === "k2" ? SOCCER_PLAYER_RECORDS_K2 : SOCCER_PLAYER_RECORDS_K1, (row) =>
    row.playerId ? `${row.teamId}:${row.playerId}` : `${row.teamId}:${row.playerName}`,
  ).map((row, index) => ({
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

  return [row.playerName, row.playerFullName, row.teamName, row.teamShortName, row.position, row.teamId];
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
      <div className={`${styles.nameCell} ${styles.teamCell}`}>
        <div>
          <strong>{row.teamShortName}</strong>
          <span>{row.teamName}</span>
        </div>
        <TeamRecordImage className={styles.logo} src={getImageUrl(row.imageUrl, row.logoUrl, row.teamImageUrl)} />
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
        <TeamRecordImage className={styles.avatar} src={getImageUrl(row.imageUrl, row.playerImageUrl, row.image)} />
        <div>
          <strong>{getEsportsPlayerDisplayName(row)}</strong>
          <span>{row.playerName}</span>
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
      <div className={`${styles.nameCell} ${styles.teamCell}`}>
        <div>
          <strong>{row.teamShortName}</strong>
          <span>{row.teamName}</span>
        </div>
        <TeamRecordImage className={styles.logo} src={getImageUrl(row.logoUrl, row.imageUrl, row.teamImageUrl)} />
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
        <TeamRecordImage className={styles.avatar} src={getImageUrl(row.imageUrl, row.playerImageUrl, row.image)} />
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
      <div className={`${styles.nameCell} ${styles.teamCell}`}>
        <div>
          <strong>{row.teamShortName}</strong>
          <span>{row.teamName}</span>
        </div>
        <TeamRecordImage className={styles.logo} src={row.logoUrl} />
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
        <TeamRecordImage className={styles.avatar} src={row.imageUrl} />
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
  const [remoteRowsByKey, setRemoteRowsByKey] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const activeLeagueId = getRecordLeagueId(activeSport, activeSoccerLeague);
  const recordDatasetKey = getRecordDatasetKey(activeSport, activeView, activeLeagueId);

  useEffect(() => {
    let isMounted = true;

    const fetchRemoteRows = async () => {
      try {
        const fetchRecords = activeView === "team" ? fetchTeamRecords : fetchPlayerRecords;
        const rows = await fetchRecords({
          leagueId: activeLeagueId,
          sportId: activeSport,
        });

        if (!isMounted) {
          return;
        }

        setRemoteRowsByKey((currentRowsByKey) => ({
          ...currentRowsByKey,
          [recordDatasetKey]: rows,
        }));
      } catch (error) {
        console.warn("레코드 조회 중 Supabase 요청이 실패했습니다.", error);
      }
    };

    fetchRemoteRows();
    const unsubscribe = subscribeTeamRecords(fetchRemoteRows);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeLeagueId, activeSport, activeView, recordDatasetKey]);

  const baseRows = useMemo(() => {
    const remoteRows = remoteRowsByKey[recordDatasetKey];

    if (Array.isArray(remoteRows) && remoteRows.length > 0) {
      return remoteRows;
    }

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
  }, [activeSport, activeView, activeSoccerLeague, recordDatasetKey, remoteRowsByKey]);

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
    <>
      <SubNav ariaLabel="팀 메뉴" items={TEAMS_SUB_NAV_ITEMS} />

      <main className={styles.page}>
        <div className="container">
          <header className={styles.hero}>
            <p className={styles.eyebrow}>EXPLORE RECORDS</p>
            <h1 className={styles.title}>레코드</h1>
            <p className={styles.subtitle}>
              팀과 선수의 기록을 한눈에 비교해보세요.
            </p>
          </header>

          <section
            className={styles.controlSection}
            aria-label="record controls"
          >
            <div className={styles.controlBlock}>
              <MatchFilter
                filters={SPORT_TABS}
                activeFilter={activeSport}
                onChange={handleSportChange}
              />
            </div>

            <div className={styles.controlBlock}>
              <PillTabs
                tabs={VIEW_TABS}
                activeId={activeView}
                onChange={handleViewChange}
                ariaLabel="record table tabs"
                variant="calendar"
              />
            </div>

            <div className={`${styles.controlBlock} ${styles.searchBlock}`}>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="팀명, 선수명 검색"
                ariaLabel="team record search"
                debounceDelay={250}
              />
            </div>

            {activeView === "player" ? (
              <div className={`${styles.controlBlock} ${styles.teamFilterBlock}`}>
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
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTopBar}>
              <div className={styles.sectionBadge}>{sportLabel}</div>
              {activeSport === "soccer" ? (
                <MatchFilter
                  filters={SOCCER_LEAGUE_TABS}
                  activeFilter={activeSoccerLeague}
                  onChange={handleSoccerLeagueChange}
                />
              ) : null}
            </div>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
              </div>
              <p className={styles.sectionCount}>
                {visibleRows.length.toLocaleString("en-US")} ROWS
              </p>
            </div>

            <RecordTable
              key={`${activeSport}-${activeView}-${activeSoccerLeague}`}
              columns={activeColumns}
              rows={visibleRows}
              getRowKey={(row) => getRecordRowKey(row, activeSport, activeView)}
              ariaLabel={`${activeSport} ${activeView} record table`}
            />
          </section>
        </div>
      </main>
    </>
  );
};

export default TeamRecordPage;
