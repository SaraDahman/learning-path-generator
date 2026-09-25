import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authApi from "../api/auth.api.js";

export const AuthSessionContext = createContext(null);

export function AuthSessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!authApi.getStoredSession()) {
      setStatus("unauthenticated");
      return;
    }

    let active = true;

    authApi
      .me()
      .then((data) => {
        if (!active) return;
        const nextUser = data?.user ?? null;
        setUser(nextUser);
        setStatus(nextUser ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (!active) return;
        authApi.clearStoredSession();
        setUser(null);
        setStatus("unauthenticated");
      });

    return () => {
      active = false;
    };
  }, []);

  const adoptSession = useCallback(({ accessToken, user: nextUser }) => {
    authApi.storeSession({ accessToken, user: nextUser });
    setUser(nextUser ?? null);
    setStatus(nextUser ? "authenticated" : "unauthenticated");
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // The stored token is discarded either way; a failed call must not
      // leave the user stuck in a signed-in state.
    }
    authApi.clearStoredSession();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === "loading",
      isAuthenticated: status === "authenticated",
      adoptSession,
      signOut,
    }),
    [user, status, adoptSession, signOut],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}
