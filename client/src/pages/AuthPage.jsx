import { BookOpen } from "lucide-react";
import AuthForm from "../components/AuthForm.jsx";
import HeroPanel from "../components/HeroPanel.jsx";

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#18233d]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <HeroPanel />

        <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-[430px]">
            <AuthForm />

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
