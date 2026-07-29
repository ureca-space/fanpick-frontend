import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import EmptyState from "../../components/EmptyState/EmptyState";
import MatchFilter from "../../components/MatchFilter/MatchFilter";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import SearchInput from "../../components/SearchInput/SearchInput";
import ViewAllLink from "../../components/ViewAllLink/ViewAllLink";
import WorldCupCard from "./components/WorldCupCard/WorldCupCard";
import {
  WORLD_CUP_FILTERS,
  WORLD_CUP_SECTION_LABELS,
  WORLD_CUPS,
} from "./data/worldCupData";
import styles from "./WorldCupPage.module.css";

const WORLD_CUPS_PER_PAGE = 2;

const VALID_FILTER_IDS = WORLD_CUP_FILTERS.map((filter) => filter.id);

const getValidFilter = (filterId) =>
  VALID_FILTER_IDS.includes(filterId) ? filterId : "all";

const WorldCupPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sectionPages, setSectionPages] = useState({});

  const activeFilter = getValidFilter(searchParams.get("league"));
  const searchKeyword = searchParams.get("keyword") || "";
  const hasSearchKeyword = searchKeyword.trim() !== "";
  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  const filteredWorldCups = WORLD_CUPS.filter((worldCup) => {
    const matchesFilter =
      activeFilter === "all" || worldCup.playId === activeFilter;
    const searchableText =
      `${worldCup.title} ${worldCup.description} ${worldCup.category}`.toLowerCase();
    const matchesKeyword =
      !normalizedKeyword || searchableText.includes(normalizedKeyword);

    return matchesFilter && matchesKeyword;
  });

  const sectionIds =
    activeFilter === "all"
      ? WORLD_CUP_FILTERS.filter((filter) => filter.id !== "all").map(
          (filter) => filter.id,
        )
      : [activeFilter];

  const sections = sectionIds
    .map((sectionId) => ({
      id: sectionId,
      label: WORLD_CUP_SECTION_LABELS[sectionId],
      worldCups: filteredWorldCups.filter(
        (worldCup) => worldCup.playId === sectionId,
      ),
    }))
    .filter((section) => section.worldCups.length > 0);

  const getSectionPage = (sectionId, totalPages) =>
    Math.min(sectionPages[sectionId] || 0, Math.max(totalPages - 1, 0));

  const handleMoveSection = (sectionId, direction, totalPages) => {
    const currentPage = getSectionPage(sectionId, totalPages);
    const nextPage = Math.min(
      Math.max(currentPage + direction, 0),
      Math.max(totalPages - 1, 0),
    );

    setSectionPages((previousPages) => ({
      ...previousPages,
      [sectionId]: nextPage,
    }));
  };

  const handleStart = (worldCup) => {
    const playPath =
      worldCup.candidates.length > 0 ? worldCup.id : worldCup.playId;

    navigate(`/worldcup/${playPath}`);
  };

  const handleFilterChange = (filterId) => {
    const nextFilter = getValidFilter(filterId);

    setSearchParams((previousParams) => {
      const nextParams = new URLSearchParams(previousParams);

      if (nextFilter === "all") {
        nextParams.delete("league");
      } else {
        nextParams.set("league", nextFilter);
      }

      return nextParams;
    });
  };

  const handleSearchChange = (keyword) => {
    setSearchParams(
      (previousParams) => {
        const nextParams = new URLSearchParams(previousParams);

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

  return (
    <main className={styles.worldCupPage}>
      <div className="container">
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>PICK YOUR FAVORITE</p>
          <h1 className={styles.title}>PICK BATTLE</h1>
          <p className={styles.description}>
            둘 중 하나를 선택하며 나만의 최애를 찾아보세요.
          </p>
        </header>

        <div className={styles.controlArea}>
          <div className={styles.filterArea}>
            <MatchFilter
              filters={WORLD_CUP_FILTERS}
              activeFilter={activeFilter}
              onChange={handleFilterChange}
            />
          </div>

          <div className={styles.searchArea}>
            <SearchInput
              value={searchKeyword}
              onChange={handleSearchChange}
              placeholder="월드컵 제목을 검색해보세요"
              ariaLabel="월드컵 검색"
              debounceDelay={500}
            />
          </div>
        </div>

        {hasSearchKeyword && filteredWorldCups.length > 0 && (
          <div className={styles.searchResultHeader} aria-live="polite">
            <p>
              <strong>{searchKeyword}</strong> 검색 결과
            </p>

            <span>{filteredWorldCups.length} PICK BATTLES</span>
          </div>
        )}

        {hasSearchKeyword && filteredWorldCups.length > 0 ? (
          <div className={styles.worldCupGrid}>
            {filteredWorldCups.map((worldCup) => (
              <WorldCupCard
                key={worldCup.id}
                worldCup={worldCup}
                onStart={() => handleStart(worldCup)}
              />
            ))}
          </div>
        ) : sections.length > 0 ? (
          <div className={styles.worldCupSections}>
            {sections.map((section) => {
              const totalPages = Math.ceil(
                section.worldCups.length / WORLD_CUPS_PER_PAGE,
              );
              const currentPage = getSectionPage(section.id, totalPages);
              const visibleWorldCups = section.worldCups.slice(
                currentPage * WORLD_CUPS_PER_PAGE,
                (currentPage + 1) * WORLD_CUPS_PER_PAGE,
              );

              return (
                <section
                  key={section.id}
                  className={styles.worldCupSection}
                  aria-labelledby={`${section.id}-world-cup-title`}
                >
                  <div className={styles.sectionHeader}>
                    <h2
                      id={`${section.id}-world-cup-title`}
                      className={styles.sectionTitle}
                    >
                      {section.label}
                    </h2>

                    {activeFilter === "all" && (
                      <ViewAllLink
                        onClick={() => handleFilterChange(section.id)}
                      />
                    )}
                  </div>

                  <PaginationControls
                    ariaLabel={`${section.label} 월드컵 카드 페이지 이동`}
                    className={styles.sectionNavigation}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    previousLabel={`${section.label} 이전 월드컵 보기`}
                    nextLabel={`${section.label} 다음 월드컵 보기`}
                    onPrevious={() =>
                      handleMoveSection(section.id, -1, totalPages)
                    }
                    onNext={() => handleMoveSection(section.id, 1, totalPages)}
                  />

                  <div className={styles.worldCupGrid}>
                    {visibleWorldCups.map((worldCup) => (
                      <WorldCupCard
                        key={worldCup.id}
                        worldCup={worldCup}
                        onStart={() => handleStart(worldCup)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <EmptyState
            className={styles.emptyMessage}
            title="검색 조건에 맞는 월드컵이 없습니다."
            description="검색어를 바꾸거나 필터를 전체로 변경해 보세요."
          />
        )}
      </div>
    </main>
  );
};

export default WorldCupPage;
