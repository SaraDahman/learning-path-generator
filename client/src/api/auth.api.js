import { clearStoredSession, request } from "./http.js";

export {
  clearStoredSession,
  getStoredSession,
  storeSession,
} from "./http.js";

export const register = (values) =>
  request("/api/auth/register", { method: "POST", body: values });

export const login = (values) =>
  request("/api/auth/login", { method: "POST", body: values });

export const me = () => request("/api/auth/me", { auth: true });

export const logout = () =>
  request("/api/auth/logout", { method: "POST", auth: true });
