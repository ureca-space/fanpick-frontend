import { useParams } from "react-router-dom";

const WorldCupPlayPage = () => {
  const { id } = useParams();

  return <main>{id} 이상형 월드컵 진행 페이지</main>;
};

export default WorldCupPlayPage;
