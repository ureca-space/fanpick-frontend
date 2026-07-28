import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import useAuth from "../../contexts/useAuth";
import {
  getWorldCupResultStats,
  saveWorldCupResult,
} from "../../services/worldCupApi";
import { getWorldCupById } from "../WorldCup/data/worldCupData";
import WorldCupBattleStage from "./components/WorldCupBattleStage";
import WorldCupResultView from "./components/WorldCupResultView";
import WorldCupRoundSelector from "./components/WorldCupRoundSelector";

const shuffleCandidates = (candidates) =>
  [...candidates].sort(() => Math.random() - 0.5);

const ROUND_OPTIONS = [4, 8, 16, 32, 64];

const getInitialCandidates = (worldCup, roundSize) => {
  const shuffledCandidates = shuffleCandidates(worldCup.candidates);

  return shuffledCandidates.slice(0, roundSize);
};

const WorldCupGame = ({ worldCup }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const worldCupId = worldCup.id;
  const usesExpandedImages = [
    "baseball-funny",
    "lol-thumbnail",
    "lol-team",
  ].includes(worldCup.id);
  const usesLargePortraitImages = worldCup.id === "soccer-player-skill";
  const [selectedRound, setSelectedRound] = useState(null);
  const [roundSelection, setRoundSelection] = useState("");
  const [isRoundSelectOpen, setIsRoundSelectOpen] = useState(false);
  const [contestants, setContestants] = useState([]);
  const [pairIndex, setPairIndex] = useState(0);
  const [roundWinners, setRoundWinners] = useState([]);
  const [champion, setChampion] = useState(null);
  const [resultSaveStatus, setResultSaveStatus] = useState("idle");
  const [resultSaveError, setResultSaveError] = useState("");
  const [resultStats, setResultStats] = useState([]);
  const [statsStatus, setStatsStatus] = useState("idle");
  const availableRounds = ROUND_OPTIONS.filter(
    (roundSize) => roundSize <= worldCup.candidates.length,
  );
  const selectedRoundOption =
    Number(roundSelection) || availableRounds[availableRounds.length - 1];

  useEffect(() => {
    if (!champion) {
      return;
    }

    let isActive = true;

    const loadStats = async () => {
      setStatsStatus("loading");

      try {
        const stats = await getWorldCupResultStats(worldCupId);

        if (isActive) {
          setResultStats(stats);
          setStatsStatus("loaded");
        }
      } catch (error) {
        console.warn("월드컵 통계를 불러오지 못했습니다.", error);

        if (isActive) {
          setStatsStatus("error");
        }
      }
    };

    void loadStats();

    return () => {
      isActive = false;
    };
  }, [champion, worldCupId]);

  const currentPair = contestants.slice(pairIndex, pairIndex + 2);
  const matchNumber = pairIndex / 2 + 1;
  const hasBye = contestants.length % 2 === 1;
  const pairedCandidateCount = hasBye
    ? contestants.length - 1
    : contestants.length;
  const totalMatches = pairedCandidateCount / 2;
  const bracketSize = 2 ** Math.ceil(Math.log2(contestants.length));
  const roundLabel = contestants.length === 2 ? "결승" : `${bracketSize}강`;

  const persistChampion = async (selectedCandidate) => {
    if (!userId) {
      setResultSaveStatus("guest");
      return;
    }

    setResultSaveStatus("saving");
    setResultSaveError("");

    try {
      await saveWorldCupResult({
        userId,
        worldCupId,
        championCandidateId: selectedCandidate.id,
      });
      setResultSaveStatus("saved");
    } catch (error) {
      console.warn("월드컵 최종 선택을 저장하지 못했습니다.", error);
      setResultSaveStatus("error");
      setResultSaveError(error.message || "알 수 없는 오류");
    }
  };

  const handleChoose = async (selectedCandidate) => {
    const nextWinners = [...roundWinners, selectedCandidate];
    const isLastPair = pairIndex + 2 >= pairedCandidateCount;

    if (isLastPair && hasBye) {
      nextWinners.push(contestants[contestants.length - 1]);
    }

    const isChampion = isLastPair && nextWinners.length === 1;

    if (isChampion) {
      await persistChampion(selectedCandidate);
    }

    if (!isLastPair) {
      setRoundWinners(nextWinners);
      setPairIndex(pairIndex + 2);
      return;
    }

    if (nextWinners.length === 1) {
      setChampion(selectedCandidate);
      return;
    }

    setContestants(nextWinners);
    setRoundWinners([]);
    setPairIndex(0);
  };

  const handleRestart = () => {
    setSelectedRound(null);
    setRoundSelection("");
    setIsRoundSelectOpen(false);
    setContestants([]);
    setPairIndex(0);
    setRoundWinners([]);
    setChampion(null);
    setResultSaveStatus("idle");
    setResultSaveError("");
    setResultStats([]);
    setStatsStatus("idle");
  };

  const handleStartRound = () => {
    const roundSize = selectedRoundOption;

    setSelectedRound(roundSize);
    setContestants(getInitialCandidates(worldCup, roundSize));
    setPairIndex(0);
    setRoundWinners([]);
    setChampion(null);
  };

  const handleRoundSelectBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsRoundSelectOpen(false);
    }
  };

  const handleSelectRoundOption = (roundSize) => {
    setRoundSelection(String(roundSize));
    setIsRoundSelectOpen(false);
  };

  if (!selectedRound) {
    return (
      <WorldCupRoundSelector
        availableRounds={availableRounds}
        isRoundSelectOpen={isRoundSelectOpen}
        selectedRoundOption={selectedRoundOption}
        worldCup={worldCup}
        onBlurRoundSelect={handleRoundSelectBlur}
        onSelectRoundOption={handleSelectRoundOption}
        onStartRound={handleStartRound}
        onToggleRoundSelect={() => setIsRoundSelectOpen((isOpen) => !isOpen)}
      />
    );
  }

  if (champion) {
    return (
      <WorldCupResultView
        champion={champion}
        resultSaveError={resultSaveError}
        resultSaveStatus={resultSaveStatus}
        resultStats={resultStats}
        statsStatus={statsStatus}
        worldCup={worldCup}
        onBackToList={() => navigate("/worldcup")}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <WorldCupBattleStage
      currentPair={currentPair}
      matchNumber={matchNumber}
      roundLabel={roundLabel}
      totalMatches={totalMatches}
      usesExpandedImages={usesExpandedImages}
      usesLargePortraitImages={usesLargePortraitImages}
      worldCup={worldCup}
      onChoose={handleChoose}
    />
  );
};

const WorldCupPlayPage = () => {
  const { id } = useParams();
  const selectedWorldCup = getWorldCupById(id);

  if (!selectedWorldCup?.candidates.length) {
    return <Navigate to="/worldcup" replace />;
  }

  return <WorldCupGame worldCup={selectedWorldCup} />;
};

export default WorldCupPlayPage;
