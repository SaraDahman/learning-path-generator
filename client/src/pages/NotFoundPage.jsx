import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7fb] px-5 text-center text-[#18233d]">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#637091]">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">
        No such page
      </h1>
      <p className="mt-3 max-w-sm text-[15px] leading-7 text-[#5d6785]">
        That address does not match anything here. It may have been mistyped, or
        the path may have been deleted.
      </p>
      <Link className="submit-button mt-8 w-auto" to="/generate">
        Back to generating
      </Link>
    </main>
  );
}
