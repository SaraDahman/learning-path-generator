import { LogOut, ShieldCheck } from "lucide-react";
import useAuthSession from "../hooks/useAuthSession.js";

export default function SessionPanel() {
  const { user, signOut } = useAuthSession();
  const name = user?.username || user?.email || "Your account";

  return (
    <div className="session-card">
      <div className="session-badge">
        <ShieldCheck size={20} />
      </div>
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#637091]">
        Signed in
      </p>
      <h2 className="text-3xl font-semibold tracking-[-0.035em] text-[#18233d]">
        {name}
      </h2>
      {user?.email && user.email !== name && (
        <p className="mt-3 text-sm leading-6 text-[#66718b]">{user.email}</p>
      )}

      <button className="signout-button" type="button" onClick={signOut}>
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}
