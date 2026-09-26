import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./components/RequireAuth.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import GeneratePage from "./pages/GeneratePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import PathPage from "./pages/PathPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthPage />} path="/login" />

        <Route element={<Navigate replace to="/dashboard" />} path="/" />

        <Route
          element={
            <RequireAuth>
              <GeneratePage />
            </RequireAuth>
          }
          path="/generate"
        />

        <Route
          element={
            <RequireAuth>
              <PathPage />
            </RequireAuth>
          }
          path="/paths/:id"
        />

        <Route
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
          path="/dashboard"
        />

        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}
