import { ArrowRight, Loader2 } from "lucide-react";

export default function SubmitButton({ isSubmitting, isSignup }) {
  return (
    <button className="submit-button" disabled={isSubmitting} type="submit">
      {isSubmitting ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          {isSignup ? "Creating account…" : "Signing in…"}
        </>
      ) : (
        <>
          {isSignup ? "Create my account" : "Log in to Pathway"}
          <ArrowRight size={18} />
        </>
      )}
    </button>
  );
}
