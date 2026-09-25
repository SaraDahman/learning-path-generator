const SESSION_KEY = "lpg.session";

export const getStoredSession = () => {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return typeof parsed?.accessToken === "string" && parsed.accessToken
      ? parsed
      : null;
  } catch {
    return null;
  }
};

export const storeSession = ({ accessToken, user }) => {
  if (!accessToken) return;

  try {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ accessToken, user: user ?? null }),
    );
  } catch {
    return;
  }
};

export const clearStoredSession = () => {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    return;
  }
};

const request = async (path, { method = "GET", body, auth = false } = {}) => {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const session = getStoredSession();
    if (session) headers.Authorization = `Bearer ${session.accessToken}`;
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) clearStoredSession();

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.error?.message || "Something went wrong. Please try again.",
    );
    error.isApiError = true;
    error.status = response.status;
    error.code = data?.error?.code;
    error.fields = data?.error?.fields;
    throw error;
  }

  return data;
};

export const register = (values) =>
  request("/api/auth/register", { method: "POST", body: values });

export const login = (values) =>
  request("/api/auth/login", { method: "POST", body: values });

export const me = () => request("/api/auth/me", { auth: true });

export const logout = () =>
  request("/api/auth/logout", { method: "POST", auth: true });
