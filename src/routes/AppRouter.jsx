import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout/MainLayout";

import ProtectedRoute from "./ProtectedRoute";
import ScrollToTop from "./ScrollToTop";

const HomePage = lazy(() => import("../pages/Home/HomePage"));
const TeamsPage = lazy(() => import("../pages/Teams/TeamsPage"));
const TeamDetailPage = lazy(() => import("../pages/Teams/TeamDetailPage"));
const MatchSchedulePage = lazy(
  () => import("../pages/MatchSchedule/MatchSchedulePage"),
);
const CalendarPage = lazy(() => import("../pages/Calendar/CalendarPage"));
const PredictionPage = lazy(() => import("../pages/Prediction/PredictionPage"));
const CommunityPage = lazy(() => import("../pages/Community/CommunityPage"));
const CommunityWritePage = lazy(
  () => import("../pages/Community/Write/CommunityWritePage"),
);
const CommunityDetailPage = lazy(
  () => import("../pages/Community/Detail/CommunityDetailPage"),
);
const WorldCupPage = lazy(() => import("../pages/WorldCup/WorldCupPage"));
const WorldCupPlayPage = lazy(
  () => import("../pages/WorldCupPlay/WorldCupPlayPage"),
);
const MyPage = lazy(() => import("../pages/MyPage/MyPage"));
const NotFoundPage = lazy(() => import("../pages/NotFound/NotFoundPage"));

const LoginPage = lazy(() => import("../pages/Auth/Login/LoginPage"));
const SignupPage = lazy(() => import("../pages/Auth/Signup/SignupPage"));
const FindPasswordPage = lazy(
  () => import("../pages/Auth/FindPassword/FindPasswordPage"),
);
const ResetPasswordPage = lazy(
  () => import("../pages/Auth/ResetPassword/ResetPassword"),
);

const AppRouter = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Suspense fallback={null}>
        <Routes>
          <Route element={<MainLayout />}>
            {/* 누구나 접근 가능 */}
            <Route path="/" element={<HomePage />} />

            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
            <Route path="/players" element={<Navigate to="/teams" replace />} />
            <Route path="/matches" element={<MatchSchedulePage />} />
            <Route path="/prediction" element={<PredictionPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/write" element={<CommunityWritePage />} />
            <Route path="/community/:postId" element={<CommunityDetailPage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/find-password" element={<FindPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* 로그인 사용자만 접근 가능 */}
            <Route element={<ProtectedRoute />}>
              <Route path="/worldcup" element={<WorldCupPage />} />
              <Route path="/worldcup/:id" element={<WorldCupPlayPage />} />
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
            </Route>

            {/* 존재하지 않는 경로 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
