import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout/MainLayout";

import HomePage from "../pages/Home/HomePage";
import PlayersPage from "../pages/Players/PlayersPage";
import MatchSchedulePage from "../pages/MatchSchedule/MatchSchedulePage";
import CalendarPage from "../pages/Calendar/CalendarPage";
import PredictionPage from "../pages/Prediction/PredictionPage";
import WorldCupPage from "../pages/WorldCup/WorldCupPage";
import WorldCupPlayPage from "../pages/WorldCupPlay/WorldCupPlayPage";
import MyPage from "../pages/MyPage/MyPage";
import NotFoundPage from "../pages/NotFound/NotFoundPage";

import LoginPage from "../pages/Auth/Login/LoginPage";
import SignupPage from "../pages/Auth/Signup/SignupPage";
import FindPasswordPage from "../pages/Auth/FindPassword/FindPasswordPage";
import ResetPasswordPage from "../pages/Auth/ResetPassword/ResetPassword";

import ProtectedRoute from "./ProtectedRoute";
import ScrollToTop from "./ScrollToTop";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Routes>
        <Route element={<MainLayout />}>
          {/* 누구나 접근 가능 */}
          <Route path="/" element={<HomePage />} />

          <Route path="/players" element={<PlayersPage />} />
          <Route path="/matches" element={<MatchSchedulePage />} />
          <Route path="/calendar" element={<CalendarPage />} />

          <Route path="/worldcup" element={<WorldCupPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/find-password" element={<FindPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* 로그인 사용자만 접근 가능 */}
          <Route element={<ProtectedRoute />}>
            <Route path="/prediction" element={<PredictionPage />} />
            <Route path="/worldcup/:id" element={<WorldCupPlayPage />} />
            <Route path="/mypage" element={<MyPage />} />
          </Route>

          {/* 존재하지 않는 경로 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
