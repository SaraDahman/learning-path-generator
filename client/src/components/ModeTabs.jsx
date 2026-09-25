export default function ModeTabs({ mode, onChange }) {
  return (
    <div className="mb-7 flex items-center gap-1 rounded-xl bg-[#e8ebf3] p-1">
      <button
        className={`mode-tab ${mode !== "signup" ? "mode-tab-active" : ""}`}
        onClick={() => onChange("login")}
        type="button"
      >
        Log in
      </button>
      <button
        className={`mode-tab ${mode === "signup" ? "mode-tab-active" : ""}`}
        onClick={() => onChange("signup")}
        type="button"
      >
        Create account
      </button>
    </div>
  );
}
