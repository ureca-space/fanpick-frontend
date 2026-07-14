import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../contexts/useAuth";

const ProtectedRoute = () => {
  const { isLoggedIn, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return null;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
