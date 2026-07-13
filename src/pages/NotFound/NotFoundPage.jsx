import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <main>
      <h1>404</h1>
      <p>페이지를 찾을 수 없습니다.</p>
      <Link to="/">홈으로 이동</Link>
    </main>
  );
};

export default NotFoundPage;
