import { useContext } from "react";
import { AuthSessionContext } from "./SessionContext.jsx";

export default function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error(
      "useAuthSession must be called inside an AuthSessionProvider.",
    );
  }

  return context;
}
