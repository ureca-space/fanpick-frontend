import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LOGOUT_REDIRECT_STORAGE_KEY } from "../constants/authFlow";
import useAuth from "../contexts/useAuth";

const hasPendingLogoutRedirect = () => {
  return window.sessionStorage.getItem(LOGOUT_REDIRECT_STORAGE_KEY) === "1";
};

const ProtectedRoute = () => {
  const { isLoggedIn, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return null;
  }

  if (!isLoggedIn) {
    if (hasPendingLogoutRedirect()) {
      return <Navigate to="/" replace state={{ authDialog: "logout" }} />;
    }

    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
