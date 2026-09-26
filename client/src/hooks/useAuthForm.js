import { useState } from "react";
import { loginSchema, signupSchema } from "../../../shared/validation.js";
import * as authApi from "../api/auth.api.js";
import { offlineMessage } from "../api/http.js";
import useAuthSession from "./useAuthSession.js";

const initialValues = {
  username: "",
  email: "",
  password: "",
};

const getFieldError = (schema, values, field) => {
  const result = schema.safeParse(values);
  if (result.success) return "";
  return (
    result.error.issues.find((issue) => issue.path[0] === field)?.message || ""
  );
};

export default function useAuthForm() {
  const [mode, setMode] = useState("login");
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { adoptSession } = useAuthSession();

  const isSignup = mode === "signup";
  const schema = isSignup ? signupSchema : loginSchema;

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setValues(initialValues);
    setErrors({});
    setFormError("");
    setSuccessMessage("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    setSuccessMessage("");
    setFormError("");
    setErrors((current) => ({
      ...current,
      [name]: getFieldError(schema, nextValues, name),
    }));
  };

  const validateForm = () => {
    const result = schema.safeParse(values);

    if (result.success) {
      setErrors({});
      return true;
    }

    const nextErrors = {};
    result.error.issues.forEach((issue) => {
      nextErrors[issue.path[0]] = issue.message;
    });
    setErrors(nextErrors);
    return false;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const data = isSignup
        ? await authApi.register(values)
        : await authApi.login(values);

      setSuccessMessage(
        data.message || (isSignup ? "Account created." : "Welcome back."),
      );

      if (data.session?.access_token) {
        adoptSession({ accessToken: data.session.access_token, user: data.user });
      } else if (isSignup) {
        setValues(initialValues);
      }
    } catch (error) {
      if (error.isApiError) {
        if (error.fields) {
          setErrors((current) => ({ ...current, ...error.fields }));
        }
        setFormError(error.message);
      } else {
        setFormError(offlineMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    mode,
    isSignup,
    values,
    errors,
    formError,
    successMessage,
    isSubmitting,
    switchMode,
    handleChange,
    handleSubmit,
  };
}
