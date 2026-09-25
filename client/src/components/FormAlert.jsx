import { CheckCircle2 } from "lucide-react";

export default function FormAlert({ tone, children }) {
  if (tone === "success") {
    return (
      <div className="form-alert form-alert-success" role="status">
        <CheckCircle2 size={18} />
        <span>{children}</span>
      </div>
    );
  }

  return (
    <div className="form-alert form-alert-error" role="alert">
      {children}
    </div>
  );
}
