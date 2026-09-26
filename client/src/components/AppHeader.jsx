import { Compass, LayoutDashboard, LogOut, PlusCircle } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import useAuthSession from "../hooks/useAuthSession.js";

const links = [
  { to: "/generate", label: "Generate", icon: PlusCircle },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function AppHeader() {
  const { user, signOut } = useAuthSession();
  const name = user?.username || user?.email || "";

  return (
    <header className="sticky top-0 z-10 border-b border-[#e4e8f2] bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5 sm:px-8">
        <Link className="flex items-center gap-2.5" to="/generate">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#101b35] text-[#9df0d9]">
            <Compass size={17} strokeWidth={1.9} />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#18233d]">
            Pathway
          </span>
        </Link>

        <nav className="flex items-center gap-1.5">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-[#eef0ff] text-[#3f4ad9]"
                    : "text-[#5d6785] hover:bg-[#f3f5fb] hover:text-[#18233d]"
                }`
              }
              to={to}
            >
              <Icon size={15} strokeWidth={1.9} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {name && (
            <span className="max-w-[180px] truncate text-[13px] text-[#7a849b]">
              {name}
            </span>
          )}
          <button
            className="signout-button signout-button-compact"
            onClick={signOut}
            type="button"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
