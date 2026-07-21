import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MatchFilter from "../../components/MatchFilter/MatchFilter";
import SearchInput from "../../components/SearchInput/SearchInput";
import { fetchPlayer } from "../../services/playerApi";
import PlayerCard from "./components/PlayerCard/PlayerCard";
import PlayerCardSkeleton from "./components/PlayerCardSkeleton/PlayerCardSkeleton";
import PlayerDetailDialog from "./components/PlayerDetailDialog/PlayerDetailDialog";
import { FEATURED_PLAYERS } from "./data/featuredPlayers";
import styles from "./PlayersPage.module.css";

const FILTERS = [
  { id: "all", label: "ALL" },
  { id: "baseball", label: "BASEBALL" },
  { id: "soccer", label: "SOCCER" },
  { id: "lol", label: "LOL" },
];

const SPORT_SECTIONS = FILTERS.filter((filter) => filter.id !== "all");
const VALID_FILTER_IDS = FILTERS.map((filter) => filter.id);

const PLAYERS_PER_SPORT_IN_ALL = 4;

const getValidFilter = (filterId) =>
  VALID_FILTER_IDS.includes(filterId) ? filterId : "all";

const getPlayersByFilter = (filterId, players) => {
  if (filterId !== "all") {
    return players.filter((player) => player.sport === filterId);
  }

  return SPORT_SECTIONS.flatMap((sport) =>
    players
      .filter((player) => player.sport === sport.id)
      .slice(0, PLAYERS_PER_SPORT_IN_ALL),
  );
};

const searchPlayers = (players, keyword) => {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return players;
  }

  return players.filter((player) => {
    const searchableText = [
      player.name,
      player.englishName,
      player.team,
      player.position,
      player.introduction,
      ...(player.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedKeyword);
  });
};

const mergePlayerData = (player, apiPlayer) => {
  if (!apiPlayer) {
    return player;
  }

  return {
    ...player,
    apiId: apiPlayer.id || player.apiId || "",
    team: apiPlayer.team || player.team || "",
    position: apiPlayer.position || player.position || "",
    image: player.image || apiPlayer.image || "",
    imageCandidates: [
      ...(player.imageCandidates || []),
      ...(apiPlayer.imageCandidates || []),
    ].filter(
      (image, index, images) => image && images.indexOf(image) === index,
    ),
    nationality: apiPlayer.nationality || player.nationality || "",
    birthDate: apiPlayer.birthDate || player.birthDate || "",
    height: apiPlayer.height || player.height || "",
    weight: apiPlayer.weight || player.weight || "",
  };
};

const PlayersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [players, setPlayers] = useState(FEATURED_PLAYERS);
  const [isLoading, setIsLoading] = useState(true);

  const loadedPlayerIdsRef = useRef(new Set());

  const activeFilter = getValidFilter(searchParams.get("sport"));
  const selectedPlayerId = searchParams.get("player");
  const searchKeyword = searchParams.get("keyword") || "";
  const hasSearchKeyword = searchKeyword.trim() !== "";

  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId) || null,
    [players, selectedPlayerId],
  );

  useEffect(() => {
    let isCancelled = false;

    const loadPlayers = async () => {
      const targetPlayers = getPlayersByFilter(activeFilter, FEATURED_PLAYERS);

      const playersToLoad = targetPlayers.filter(
        (player) => !loadedPlayerIdsRef.current.has(player.id),
      );

      if (playersToLoad.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const results = await Promise.allSettled(
          playersToLoad.map(async (player) => {
            const apiPlayer = await fetchPlayer(player);

            return {
              localPlayerId: player.id,
              apiPlayer,
            };
          }),
        );

        if (isCancelled) return;

        const apiPlayerMap = new Map();

        results.forEach((result, index) => {
          const player = playersToLoad[index];

          loadedPlayerIdsRef.current.add(player.id);

          if (result.status === "fulfilled") {
            apiPlayerMap.set(
              result.value.localPlayerId,
              result.value.apiPlayer,
            );

            return;
          }

          console.error(`${player.name} 선수 정보 조회 실패:`, result.reason);
        });

        setPlayers((previousPlayers) =>
          previousPlayers.map((player) => {
            if (!apiPlayerMap.has(player.id)) {
              return player;
            }

            return mergePlayerData(player, apiPlayerMap.get(player.id));
          }),
        );
      } catch (error) {
        console.error("선수 정보를 불러오지 못했습니다.", error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPlayers();

    return () => {
      isCancelled = true;
    };
  }, [activeFilter]);

  useEffect(() => {
    if (!selectedPlayerId) return undefined;

    const targetPlayer = FEATURED_PLAYERS.find(
      (player) => player.id === selectedPlayerId,
    );

    if (!targetPlayer) {
      setSearchParams(
        (previousParams) => {
          const nextParams = new URLSearchParams(previousParams);

          nextParams.delete("player");

          return nextParams;
        },
        { replace: true },
      );

      return undefined;
    }

    if (loadedPlayerIdsRef.current.has(targetPlayer.id)) {
      return undefined;
    }

    let isCancelled = false;

    const loadSelectedPlayer = async () => {
      try {
        const apiPlayer = await fetchPlayer(targetPlayer);

        if (isCancelled) return;

        loadedPlayerIdsRef.current.add(targetPlayer.id);

        if (!apiPlayer) return;

        setPlayers((previousPlayers) =>
          previousPlayers.map((player) =>
            player.id === targetPlayer.id
              ? mergePlayerData(player, apiPlayer)
              : player,
          ),
        );
      } catch (error) {
        if (isCancelled) return;

        loadedPlayerIdsRef.current.add(targetPlayer.id);

        console.error(`${targetPlayer.name} 선수 상세 정보 조회 실패:`, error);
      }
    };

    loadSelectedPlayer();

    return () => {
      isCancelled = true;
    };
  }, [selectedPlayerId, setSearchParams]);

  const sportPlayers = useMemo(() => {
    if (activeFilter === "all") {
      return players;
    }

    return players.filter((player) => player.sport === activeFilter);
  }, [activeFilter, players]);

  const searchedPlayers = useMemo(
    () => searchPlayers(sportPlayers, searchKeyword),
    [sportPlayers, searchKeyword],
  );

  const filteredPlayers = useMemo(
    () => getPlayersByFilter(activeFilter, players),
    [activeFilter, players],
  );

  const groupedPlayers = useMemo(
    () =>
      SPORT_SECTIONS.map((sport) => ({
        ...sport,
        players: players
          .filter((player) => player.sport === sport.id)
          .slice(0, PLAYERS_PER_SPORT_IN_ALL),
      })),
    [players],
  );

  const skeletonCount = useMemo(
    () => getPlayersByFilter(activeFilter, FEATURED_PLAYERS).length,
    [activeFilter],
  );

  const playersToRender = hasSearchKeyword ? searchedPlayers : filteredPlayers;

  const resultCount = playersToRender.length;
  const resultUnit = resultCount === 1 ? "PLAYER" : "PLAYERS";

  const handleFilterChange = (filterId) => {
    const nextFilter = getValidFilter(filterId);

    setSearchParams((previousParams) => {
      const nextParams = new URLSearchParams(previousParams);

      nextParams.delete("player");

      if (nextFilter === "all") {
        nextParams.delete("sport");
      } else {
        nextParams.set("sport", nextFilter);
      }

      return nextParams;
    });
  };

  const handleSearchChange = (keyword) => {
    setSearchParams(
      (previousParams) => {
        const nextParams = new URLSearchParams(previousParams);

        nextParams.delete("player");

        if (keyword.trim()) {
          nextParams.set("keyword", keyword);
        } else {
          nextParams.delete("keyword");
        }

        return nextParams;
      },
      { replace: true },
    );
  };

  const handleViewAll = (filterId) => {
    handleFilterChange(filterId);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handlePlayerClick = (player) => {
    setSearchParams((previousParams) => {
      const nextParams = new URLSearchParams(previousParams);

      nextParams.set("player", player.id);

      return nextParams;
    });
  };

  const handleDialogClose = () => {
    setSearchParams((previousParams) => {
      const nextParams = new URLSearchParams(previousParams);

      nextParams.delete("player");

      return nextParams;
    });
  };

  return (
    <main className={styles.playersPage}>
      <div className="container">
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>FIND YOUR FAVORITE</p>

          <h1 className={styles.title}>PLAYERS</h1>

          <p className={styles.description}>
            스포츠를 잘 몰라도 괜찮아요. 인기 선수들을 살펴보고 응원하고 싶은
            나만의 선수를 찾아보세요.
          </p>
        </header>

        <div className={styles.controlArea}>
          <div className={styles.filterArea}>
            <MatchFilter
              filters={FILTERS}
              activeFilter={activeFilter}
              onChange={handleFilterChange}
            />
          </div>

          <div className={styles.searchArea}>
            <SearchInput
              value={searchKeyword}
              onChange={handleSearchChange}
              placeholder="선수 이름을 검색해보세요"
              ariaLabel="선수 검색"
              debounceDelay={500}
            />
          </div>
        </div>

        {hasSearchKeyword && !isLoading && (
          <div className={styles.searchResultHeader} aria-live="polite">
            <p>
              <strong>{searchKeyword}</strong> 검색 결과
            </p>

            <span>
              {resultCount} {resultUnit}
            </span>
          </div>
        )}

        {isLoading ? (
          <section
            className={styles.playerGrid}
            aria-label="선수 정보를 불러오는 중"
            aria-busy="true"
          >
            {Array.from({ length: skeletonCount }, (_, index) => (
              <PlayerCardSkeleton key={index} />
            ))}
          </section>
        ) : activeFilter === "all" && !hasSearchKeyword ? (
          <div className={styles.sportSections}>
            {groupedPlayers.map((section) => (
              <section
                key={section.id}
                className={styles.sportSection}
                aria-labelledby={`${section.id}-players-title`}
              >
                <div className={styles.sportHeader}>
                  <h2
                    id={`${section.id}-players-title`}
                    className={styles.sportTitle}
                  >
                    {section.label}
                  </h2>

                  <button
                    type="button"
                    className={styles.viewMoreButton}
                    onClick={() => handleViewAll(section.id)}
                  >
                    VIEW ALL
                  </button>
                </div>

                <div className={styles.playerGrid}>
                  {section.players.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onClick={handlePlayerClick}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : playersToRender.length > 0 ? (
          <section
            className={styles.playerGrid}
            aria-label={
              hasSearchKeyword
                ? `"${searchKeyword}" 선수 검색 결과`
                : `${activeFilter} 인기 선수 목록`
            }
          >
            {playersToRender.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onClick={handlePlayerClick}
              />
            ))}
          </section>
        ) : (
          <p className={styles.emptyMessage}>
            {hasSearchKeyword
              ? "검색 조건에 맞는 선수가 없습니다."
              : "해당 종목의 선수 정보를 준비하고 있습니다."}
          </p>
        )}
      </div>

      <PlayerDetailDialog player={selectedPlayer} onClose={handleDialogClose} />
    </main>
  );
};

export default PlayersPage;
