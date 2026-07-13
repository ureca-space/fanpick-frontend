import { useParams } from "react-router-dom";

const SportPage = () => {
  const { sport } = useParams();

  return <main>{sport} 경기 일정 페이지</main>;
};

export default SportPage;
