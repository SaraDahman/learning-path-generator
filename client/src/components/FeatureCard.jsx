export default function FeatureCard({ icon: Icon, label, detail }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm lg:flex lg:items-center lg:gap-4">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-[#9df0d9] lg:mb-0">
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-1 text-xs leading-5 text-[#9caac5]">{detail}</p>
      </div>
    </div>
  );
}
