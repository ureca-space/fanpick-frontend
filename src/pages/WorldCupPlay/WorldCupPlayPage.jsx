import { Navigate, useParams } from "react-router-dom";

const VALID_WORLD_CUP_IDS = new Set(["soccer", "baseball", "esports"]);

const WorldCupPlayPage = () => {
  const { id } = useParams();

  if (!VALID_WORLD_CUP_IDS.has(id)) {
    return <Navigate to="/worldcup" replace />;
  }

  return <main>{id} 이상형 월드컵 진행 페이지</main>;
};

export default WorldCupPlayPage;
