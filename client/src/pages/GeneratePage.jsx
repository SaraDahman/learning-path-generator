import { BookOpen, CalendarClock, Sparkles, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import { SKILL_LEVELS } from "../../../shared/validation.js";
import AppHeader from "../components/AppHeader.jsx";
import AuthField from "../components/AuthField.jsx";
import FormAlert from "../components/FormAlert.jsx";
import SubmitButton from "../components/SubmitButton.jsx";
import useGenerateForm from "../hooks/useGenerateForm.js";
import usePathGeneration from "../hooks/usePathGeneration.js";

const skillOptions = [
  { value: "", label: "Choose a level" },
  ...SKILL_LEVELS.map((level) => ({
    value: level,
    label: level.charAt(0).toUpperCase() + level.slice(1),
  })),
];

const howItWorks = [
  "Name the goal concretely.",
  "Pick the level that fits today, not the one you want.",
  "Be honest about time. It sets the pace.",
];

export default function GeneratePage() {
  const { values, errors, handleChange, validate, applyServerFields } =
    useGenerateForm();
  const { status, path, error, isLoading, generate, reset } =
    usePathGeneration();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;

    const { ok, payload } = validate();
    if (!ok) return;

    const result = await generate(payload);
    if (result.ok) return;

    // The server validates independently, so its per-field errors win over the
    // ones this form predicted.
    applyServerFields(result.error?.fields);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#18233d]">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-9 max-w-2xl">
          <p className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#637091]">
            <Sparkles size={14} />
            New learning path
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-[34px]">
            What do you want to be able to do?
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-[#5d6785]">
            Describe the goal in your own words. We build a step-by-step roadmap
            with real resources for the level you are at today.
          </p>
        </header>

        {status === "success" && path && (
          <div className="form-alert form-alert-success mb-8">
            <BookOpen size={18} />
            <span>
              Created &ldquo;{path.careerGoal}&rdquo; with {path.steps.length}{" "}
              steps.{" "}
              <Link
                className="font-semibold underline underline-offset-2"
                to={`/paths/${path.id}`}
              >
                Open the roadmap
              </Link>{" "}
              or{" "}
              <button
                className="font-semibold underline underline-offset-2"
                onClick={reset}
                type="button"
              >
                start over
              </button>
              .
            </span>
          </div>
        )}

        {status === "error" && error && (
          <div className="mb-8">
            <FormAlert tone="error">{error.message}</FormAlert>
          </div>
        )}

        <div className="grid gap-9 lg:grid-cols-[1fr_260px]">
          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
            <AuthField
              error={errors.career_goal}
              icon={Wand2}
              id="career_goal"
              label="Career goal"
              onChange={handleChange}
              placeholder="Become a junior front-end developer"
              value={values.career_goal}
            />

            <AuthField
              as="select"
              error={errors.skill_level}
              icon={Sparkles}
              id="skill_level"
              label="Current level"
              onChange={handleChange}
              options={skillOptions}
              value={values.skill_level}
            />

            <AuthField
              as="textarea"
              error={errors.background}
              hint="Optional. A sentence or two about what you already know."
              icon={BookOpen}
              id="background"
              label="Your background"
              onChange={handleChange}
              placeholder="I work in marketing and have never written code."
              value={values.background}
            />

            <AuthField
              error={errors.time_commitment}
              icon={CalendarClock}
              id="time_commitment"
              label="Time you can commit"
              onChange={handleChange}
              placeholder="5 hours per week"
              value={values.time_commitment}
            />

            <div className="pt-1">
              <SubmitButton isSubmitting={isLoading} variant="generate" />
            </div>
          </form>

          <aside>
            <div className="side-card">
              <p className="text-[13px] font-semibold">How this works</p>
              <ol className="mt-3 space-y-2 text-xs leading-5 text-[#66718b]">
                {howItWorks.map((line, index) => (
                  <li key={line}>
                    <span className="font-semibold text-[#4b5eff]">
                      {index + 1}.
                    </span>{" "}
                    {line}
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
