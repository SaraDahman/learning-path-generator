export default function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  icon: Icon,
  placeholder,
}) {
  return (
    <div className="space-y-2">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className={`field-shell ${error ? "field-shell-error" : ""}`}>
        <Icon
          aria-hidden="true"
          className="field-icon"
          size={18}
          strokeWidth={1.8}
        />
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete={id === "password" ? "current-password" : id}
        />
      </div>
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
