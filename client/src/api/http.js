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

export const offlineMessage =
  "We could not reach the server. Check your connection and try again.";

/**
 * The single place the browser talks to the API.
 *
 * A non-2xx becomes an Error carrying `isApiError`, the envelope's `code`, and
 * any per-field `fields`. A transport failure or an unparseable body is NOT an
 * API error: it has no `isApiError`, so callers can tell "the server said no"
 * apart from "the server was never reached" and show different messages.
 */
export const request = async (
  path,
  { method = "GET", body, auth = false } = {},
) => {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const session = getStoredSession();
    if (session) headers.Authorization = `Bearer ${session.accessToken}`;
  }

  let response;

  try {
    response = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(offlineMessage);
  }

  if (response.status === 401) clearStoredSession();

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error?.message || "Something went wrong. Please try again.");
    error.isApiError = true;
    error.status = response.status;
    error.code = data?.error?.code;
    error.fields = data?.error?.fields;
    throw error;
  }

  return data;
};
