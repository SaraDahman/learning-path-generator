---
name: client-views-and-theming
description: Client structure and UI contracts for the Learning Path Generator React app - the react-router route table, the RequireAuth wrapper and rehydration wait, the usePathGeneration state machine, shared-schema form validation, StepCard and resource rendering, ProgressBar rules, and the Tailwind v4 dark mode setup. Use when adding or changing pages, components, hooks, forms, styling, or theme behaviour.
---

# ClientViewsAndTheming

The client is a plain React SPA. Its job is to show state and collect input; every decision about what is valid and what gets stored belongs to the server. This skill covers how the pieces fit together and the visual contracts that must stay consistent.

## Routing

`react-router-dom` is not installed yet; add it when the first protected view lands. Until then `App.jsx` renders a single `AuthPage`.

Target route table:

| Route | View | Protected |
| --- | --- | --- |
| `/login` | `AuthPage` | no |
| `/` | redirect to `/generate` | yes |
| `/generate` | `GeneratePage` | yes |
| `/paths/:id` | `PathPage` | yes |
| `/dashboard` | `DashboardPage` | yes |
| `*` | not-found | no |

- The login route is reachable whether or not a session exists, and redirects to `/generate` when one does.
- `App.jsx` stays a thin shell. It declares the router and the route elements; it does not hold state or markup.
- Pages compose components. Leaf markup belongs in `components/`.

## `RequireAuth`

A wrapper that guards every protected route.

- **It must wait for session rehydration before deciding.** `useAuthSession` starts in a `loading` state while it calls `GET /api/auth/me`. Rendering the redirect on the first render, before that resolves, flashes the login screen for a user who is already signed in. Redirect only from a resolved `unauthenticated` state.
- A `401` from any request clears the stored session and sends the user to `/login`.
- It renders nothing, or a minimal placeholder, while loading. It does not render the protected view behind a spinner overlay.

## State lives in hooks

- `usePathGeneration` owns the generation lifecycle as an explicit state machine: `idle`, `loading`, `success`, `error`. The view renders from that state and nothing else.
- Only one request is in flight at a time. A second submit while `loading` is ignored, not queued.
- **"Start over" and "regenerate" reset the state to `loading` without leaving a stale path on screen.** Showing the old roadmap underneath a spinner is the classic bug here.
- A failure sets `error` with a message from the API envelope. The previous path is not silently retained; either the view is empty or it is clearly marked stale.
- Form state for the generate form lives in its own hook. Do not lift it into `App.jsx`.

## Validate before POST

- Import `pathRequestSchema` from `shared/validation.js` and run it on the client **before** calling the API, so the user gets inline field errors without a round trip.
- This is a convenience, not the security boundary. The server validates again regardless, and the server's answer wins.
- Clear a field's error as soon as the user edits that field. Leaving stale errors under a corrected field reads as broken.
- Every input has a real `<label>`, not a placeholder standing in for one. Placeholders are examples, not names.
- The `skill_level` field is a fixed three-option select, not free text, because the server enum has exactly three values. See `ai-path-generation`.

## Reuse what already exists

These components exist and are not to be duplicated:

`FormAlert` (inline messages, including API errors) · `SubmitButton` (pending state and disabled handling) · `AuthField` (the labelled field shell with error slot) · `HeroPanel` and `FeatureCard` (marketing panel, reused on the generate page) · `ModeTabs`.

The hand-written classes in `styles.css` - `field-shell`, `mode-tab`, `submit-button`, `form-alert`, `field-error` - are referenced by these components. Extend that stylesheet rather than inlining one-off CSS in a component, and keep the pattern: shared visual vocabulary in `styles.css`, layout in Tailwind utilities.

## Visual contracts

**`StepCard`** renders one step, in `step_order`, and is the most-touched component in the app:

- Numbered by `step_order` so the sequence is unmistakable.
- Shows `title`, `description`, and `estimated_time`.
- Completion is shown three ways at once: a filled checkmark, a strikethrough or dimmed title, and a colour change. Colour alone is not an accessible signal, and this is the primary feedback in the app.
- Toggling writes through the API and only then updates local state, so a failed write never shows a step as done when it is not.
- Its resources render as a nested list under the step: `title` as the link text, the URL as the `href`, and `type` as a small badge. Open external links with `rel="noreferrer"` and a visible external-link affordance.
- A step with zero resources shows nothing for resources. No empty-state box, no "no resources" text.

**`ProgressBar`** shows "N of M" as literal text next to the bar. The number is the point; the bar is decoration. Derive N and M from the loaded steps rather than storing a count.

**`DashboardPage`** lists the signed-in user's paths, most recent first, each with its goal, status, and completion count, and each linking to `/paths/:id`. It shows one honest empty state when the user has no paths yet, pointing at `/generate`. It must not show another user's paths - see `auth-and-ownership`.

## Dark mode

Tailwind v4 with no JS config file. The `dark` variant is not on by default, so it must be declared:

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

- Toggle the `dark` class on the `<html>` element. The `&:where(.dark, ...)` selector above depends on it being an ancestor.
- Persist the choice in `localStorage` under a single key, and treat the stored value as the source of truth on load.
- Add a small inline script in `client/index.html` that applies the class before first paint. Without it the page renders light and then snaps to dark, which is worse than having no toggle at preference.
- `dark:` variants only. Do not add a second set of hand-written dark classes to `styles.css` alongside the utility variants.
- Respect `prefers-color-scheme` as the default when the user has expressed no preference.

## Out of scope

No quizzes anywhere in the UI. No prerequisite display - there is nothing stored for it. No share, export, or alternate timeline view. No animation beyond a loading indicator.
