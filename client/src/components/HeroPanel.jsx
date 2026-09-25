import { Compass, CheckCircle2, Sparkles, Target } from "lucide-react";
import FeatureCard from "./FeatureCard.jsx";

const featureCards = [
  {
    icon: Target,
    label: "Goal-led",
    detail: "Paths built around what you want next.",
  },
  {
    icon: Compass,
    label: "Clear direction",
    detail: "A focused sequence, not a content dump.",
  },
  {
    icon: CheckCircle2,
    label: "Made to move",
    detail: "Small wins you can track and complete.",
  },
];

export default function HeroPanel() {
  return (
    <section className="relative overflow-hidden bg-[#101b35] px-6 pb-12 pt-7 text-white sm:px-10 lg:flex lg:w-[48%] lg:shrink-0 lg:flex-col lg:justify-between lg:px-16 lg:py-12">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#4b5eff]/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[#36d6bd]/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8fbef] text-[#101b35] shadow-[0_8px_24px_rgba(55,226,190,0.18)]">
            <Sparkles size={20} strokeWidth={2.2} />
          </div>
          <span className="text-[15px] font-semibold tracking-[0.01em]">
            Pathway
          </span>
        </div>

        <div className="mt-16 max-w-xl lg:mt-24">
          <p className="mb-5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#8fe9d1]">
            <span className="h-px w-7 bg-[#8fe9d1]" />
            Learn with intention
          </p>
          <h1 className="max-w-lg text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl">
            Turn curiosity into a clear next step.
          </h1>
          <p className="mt-6 max-w-md text-[16px] leading-7 text-[#b7c2da]">
            Build a learning path that fits your goals, your pace, and the
            version of yourself you are working toward.
          </p>
        </div>
      </div>

      <div className="relative mt-14 grid gap-3 sm:grid-cols-3 lg:mt-20 lg:grid-cols-1 lg:gap-4">
        {featureCards.map((feature) => (
          <FeatureCard key={feature.label} {...feature} />
        ))}
      </div>
    </section>
  );
}
