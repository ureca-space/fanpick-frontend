import HotMatchSection from "./components/HotMatchSection/HotMatchSection.jsx";
import MainBanner from "./components/MainBanner/MainBanner.jsx";
import MatchSection from "./components/MatchSection/MatchSection.jsx";
import MoveOnSection from "./components/MoveOnSection/MoveOnSection.jsx";
import WorldCupSection from "./components/WorldCupSection/WorldCupSection.jsx";

const HomePage = () => {
  return (
    <main>
      <MainBanner />
      <MatchSection />
      <HotMatchSection />
      <MoveOnSection />
      <WorldCupSection />
    </main>
  );
};

export default HomePage;
