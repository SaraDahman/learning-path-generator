import { useCallback, useRef, useState } from "react";
import { offlineMessage } from "../api/http.js";
import * as pathApi from "../api/path.api.js";

/**
 * The generation lifecycle, as an explicit state machine:
 * idle -> loading -> success | error.
 *
 * The in-flight guard is a ref rather than the `loading` state because state is
 * not updated until the next render. Two submits in the same tick would both
 * read a stale `status === "idle"` and both fire, which for a paid model call is
 * two paths and two charges for one click. A ref is synchronous, so the second
 * submit is genuinely ignored rather than queued behind the first.
 */
export default function usePathGeneration() {
  const [status, setStatus] = useState("idle");
  const [path, setPath] = useState(null);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const generate = useCallback(async (values) => {
    if (inFlight.current) return { ok: false, ignored: true, error: null };

    inFlight.current = true;
    setStatus("loading");
    setPath(null);
    setError(null);

    try {
      const created = await pathApi.createPath(values);
      setPath(created);
      setStatus("success");
      return { ok: true, path: created };
    } catch (caught) {
      const failure = {
        message: caught.isApiError ? caught.message : offlineMessage,
        fields: caught.fields ?? null,
      };
      setError(failure);
      setStatus("error");
      // Returned as well as stored, so the caller can apply per-field errors
      // from this tick rather than waiting for a re-render to read them back.
      return { ok: false, error: failure };
    } finally {
      inFlight.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    inFlight.current = false;
    setStatus("idle");
    setPath(null);
    setError(null);
  }, []);

  return {
    status,
    path,
    error,
    fields: error?.fields ?? null,
    isLoading: status === "loading",
    isSuccess: status === "success",
    generate,
    reset,
  };
}
