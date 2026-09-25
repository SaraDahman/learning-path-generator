const headings = {
  signup: {
    eyebrow: "Start your journey",
    title: "Create your Pathway account",
    description:
      "Save your goals and get a learning path designed for you.",
  },
  login: {
    eyebrow: "Welcome back",
    title: "Pick up where you left off",
    description: "Sign in to keep building momentum on your learning path.",
  },
};

export default function AuthHeading({ isSignup }) {
  const { eyebrow, title, description } = headings[isSignup ? "signup" : "login"];

  return (
    <div className="mb-9">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#637091]">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold tracking-[-0.035em] text-[#18233d]">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#66718b]">{description}</p>
    </div>
  );
}
