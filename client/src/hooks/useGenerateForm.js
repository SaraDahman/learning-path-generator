import { useState } from "react";
import { pathRequestSchema } from "../../../shared/validation.js";

const initialValues = {
  career_goal: "",
  skill_level: "",
  background: "",
  time_commitment: "",
};

const getFieldError = (values, field) => {
  const result = pathRequestSchema.safeParse(values);
  if (result.success) return "";
  return (
    result.error.issues.find((issue) => issue.path[0] === field)?.message || ""
  );
};

const toFieldErrors = (issues) =>
  issues.reduce((acc, issue) => {
    const field = issue.path[0];
    if (field && !acc[field]) acc[field] = issue.message;
    return acc;
  }, {});

export default function useGenerateForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    // Revalidate just this field on edit, so a corrected input sheds its error
    // immediately while the fields the user has not touched yet keep theirs.
    setErrors((current) => ({
      ...current,
      [name]: getFieldError(nextValues, name),
    }));
  };

  const validate = () => {
    const result = pathRequestSchema.safeParse(values);
    if (result.success) {
      setErrors({});
      return { ok: true, payload: result.data };
    }
    setErrors(toFieldErrors(result.error.issues));
    return { ok: false, payload: null };
  };

  const applyServerFields = (fields) => {
    if (fields) setErrors((current) => ({ ...current, ...fields }));
  };

  return { values, errors, handleChange, validate, applyServerFields };
}
