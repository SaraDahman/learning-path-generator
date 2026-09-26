import { BookOpen } from "lucide-react";
import { Navigate } from "react-router-dom";
import AuthForm from "../components/AuthForm.jsx";
import HeroPanel from "../components/HeroPanel.jsx";
import SessionSkeleton from "../components/SessionSkeleton.jsx";
import useAuthSession from "../hooks/useAuthSession.js";

export default function AuthPage() {
  const { isLoading, isAuthenticated } = useAuthSession();

  // A signed-in visitor has no business here, and both a fresh sign-in and a
  // sign-in that rehydrates belong on the dashboard. Redirecting here is what
  // lands them there, so the login form never has to navigate itself.
  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#18233d]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <HeroPanel />

        <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-[430px]">
            {isLoading ? <SessionSkeleton /> : <AuthForm />}

            <div className="mt-9 flex items-center justify-center gap-2 text-xs text-[#7a849b]">
              <BookOpen size={15} />
              <span>Your learning space, built around you.</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
