import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";

/**
 * Placeholder for phase 6. Listing the user's paths needs `GET /api/paths`,
 * which phase 3 already provides, but the page is built alongside the empty
 * state and theming in the dashboard phase.
 */
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#18233d]">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">Dashboard</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-[#5d6785]">
          Your saved paths, newest first, land here in the dashboard phase.
        </p>
        <Link className="submit-button mt-8 w-auto" to="/generate">
          Generate a path
        </Link>
      </main>
    </div>
  );
}
