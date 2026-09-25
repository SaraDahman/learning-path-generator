import { LockKeyhole, Mail, UserRound } from "lucide-react";
import useAuthForm from "../hooks/useAuthForm.js";
import AuthField from "./AuthField.jsx";
import AuthHeading from "./AuthHeading.jsx";
import FormAlert from "./FormAlert.jsx";
import ModeTabs from "./ModeTabs.jsx";
import SubmitButton from "./SubmitButton.jsx";

export default function AuthForm() {
  const {
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
  } = useAuthForm();

  return (
    <>
      <ModeTabs mode={mode} onChange={switchMode} />

      <AuthHeading isSignup={isSignup} />

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {isSignup && (
          <AuthField
            id="username"
            label="Username"
            value={values.username}
            onChange={handleChange}
            error={errors.username}
            icon={UserRound}
            placeholder="How should we call you?"
          />
        )}

        <AuthField
          id="email"
          label="Email address"
          type="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          icon={Mail}
          placeholder="you@example.com"
        />

        <AuthField
          id="password"
          label="Password"
          type="password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          icon={LockKeyhole}
          placeholder="At least 6 characters"
        />

        {formError && <FormAlert tone="error">{formError}</FormAlert>}

        {successMessage && (
          <FormAlert tone="success">{successMessage}</FormAlert>
        )}

        <SubmitButton isSubmitting={isSubmitting} isSignup={isSignup} />
      </form>
    </>
  );
}
