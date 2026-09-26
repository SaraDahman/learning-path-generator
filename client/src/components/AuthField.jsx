/**
 * The labelled field shell: label, control, error slot.
 *
 * `as` selects the control so the generate form's select and textarea reuse this
 * markup instead of duplicating the label, the `aria-describedby` wiring, and
 * the error paragraph in a second component.
 */
export default function AuthField({
  id,
  label,
  type = "text",
  as = "input",
  value,
  onChange,
  error,
  icon: Icon,
  placeholder,
  autoComplete,
  options = [],
  rows = 4,
  hint,
}) {
  const isSelect = as === "select";
  const isTextarea = as === "textarea";

  const shellClass = [
    "field-shell",
    error ? "field-shell-error" : "",
    isSelect ? "field-shell-select" : "",
    isTextarea ? "field-shell-block" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ")
    .trim();

  const shared = {
    id,
    name: id,
    value,
    onChange,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy || undefined,
  };

  return (
    <div className="space-y-2">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>

      <div className={shellClass}>
        {Icon && (
          <Icon
            aria-hidden="true"
            className="field-icon"
            size={18}
            strokeWidth={1.8}
          />
        )}

        {isSelect && (
          <select {...shared} className="field-control">
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {isTextarea && (
          <textarea
            {...shared}
            className="field-control"
            placeholder={placeholder}
            rows={rows}
          />
        )}

        {!isSelect && !isTextarea && (
          <input
            {...shared}
            className="field-control"
            type={type}
            placeholder={placeholder}
            autoComplete={autoComplete}
          />
        )}

        {isSelect && (
          <span aria-hidden="true" className="field-chevron">
            &#9662;
          </span>
        )}
      </div>

      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}

      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
