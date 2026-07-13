import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout/MainLayout";
import MyPage from "../pages/MyPage/MyPage";
import SportPage from "../pages/Sport/SportPage";
import HomePage from "../pages/Home/HomePage";
import PredictionPage from "../pages/Prediction/PredictionPage";
import WorldCupPage from "../pages/WorldCup/WorldCupPage";
import WorldCupPlayPage from "../pages/WorldCupPlay/WorldCupPlayPage";
import LoginPage from "../pages/Login/LoginPage";
import SignupPage from "../pages/Signup/SignupPage";
import NotFoundPage from "../pages/NotFound/NotFoundPage";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/sports/:sport" element={<SportPage />} />
          <Route path="/prediction" element={<PredictionPage />} />
          <Route path="/worldcup" element={<WorldCupPage />} />
          <Route path="/worldcup/:id" element={<WorldCupPlayPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
