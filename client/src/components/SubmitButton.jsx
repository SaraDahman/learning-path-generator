import { ArrowRight, Loader2 } from "lucide-react";

const labels = {
  login: { idle: "Log in to Pathway", pending: "Signing in…" },
  signup: { idle: "Create my account", pending: "Creating account…" },
  generate: { idle: "Generate my path", pending: "Building your path…" },
};

export default function SubmitButton({
  isSubmitting,
  isSignup,
  variant = isSignup ? "signup" : "login",
  showArrow = true,
}) {
  const { idle, pending } = labels[variant] ?? labels.login;

  return (
    <button className="submit-button" disabled={isSubmitting} type="submit">
      {isSubmitting ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          {pending}
        </>
      ) : (
        <>
          {idle}
          {showArrow && <ArrowRight size={18} />}
        </>
      )}
    </button>
  );
}
