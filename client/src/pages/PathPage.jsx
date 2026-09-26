import { Link, useParams } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";

/**
 * Placeholder for phase 5, which replaces this with the roadmap and the
 * completion toggles. The route exists now because a successful generation
 * links straight here, and a link to a missing route is a dead end.
 */
export default function PathPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#18233d]">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">
          Roadmap
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-[#5d6785]">
          The roadmap and its completion toggles arrive in the next phase. The
          path itself is stored, and this id is{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-[13px]">
            {id}
          </code>
          .
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="submit-button w-auto" to="/dashboard">
            Go to dashboard
          </Link>
          <Link className="text-[13px] font-medium text-[#5d6785] underline underline-offset-2" to="/generate">
            Generate another
          </Link>
        </div>
      </main>
    </div>
  );
}
