import { Navigate, useLocation } from "react-router-dom";
import useAuthSession from "../hooks/useAuthSession.js";

/**
 * Guards a protected route.
 *
 * The wait on `loading` is the whole point. Redirecting on the first render
 * would flash the login screen at a user who is already signed in, because the
 * stored token has not been confirmed yet. Only a *resolved* unauthenticated
 * state may send anyone to /login.
 */
export default function RequireAuth({ children }) {
  const { isLoading, isAuthenticated } = useAuthSession();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <div
          aria-hidden="true"
          className="h-8 w-8 animate-spin rounded-full border-2 border-[#d7dcea] border-t-[#4b5eff]"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location.pathname }} />;
  }

  return children;
}
