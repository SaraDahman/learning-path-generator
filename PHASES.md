# Build phases

The build order for the learning path generator. Six phases, each ending in something
you can check with a `curl` or a click.

This document owns **order and exit criteria**. It does not own rules. The rules live
in the five skills under `.agents/skills/`, and each phase below names the ones to load
before starting work.

## How to use this

- Phases are sequential. Do not start the next one until the current phase's exit
  criteria are met.
- At the end of each phase, update that phase's `**Status:**` line and the progress
  count at the top of this file.
- Rules, layer directions, and the parse pipeline are **not** restated here. Read the
  skill named under each phase; this file only says what to build and how to know it
  worked.

## Why server-first

Phases 1 to 3 are server-side, and 4 and 5 are the UI. This is deliberate. Every
schema trap in this project — the Postgres enums, the `updated_at` columns with no
trigger, the three-level insert — surfaces as a confusing error if you meet it while
wiring up React. Proving the API by hand first means the UI is written against
something already known to work.

## Scope

In scope: the four-entity model (user, learning path, steps, resources), Gemini
generation, authenticated access, an ordered roadmap, step completion and progress,
whole-path regeneration, single-step regeneration, a basic dashboard, and dark mode.

Out of scope, and not stretch goals: quizzes, prerequisites, multiple path variants,
per-step Q&A, an alternate timeline view, share images, and PDF or Markdown export.
See the "Settled decisions" section in `../AGENTS.md` for the reasoning.

## Groundwork, already done

- The five skills exist under `.agents/skills/<name>/SKILL.md` and load with the
  `skill` tool.
- The four tables exist in Supabase and are empty apart from `profiles`.
- The `GEMINI_API_KEY` is in `.env`.

---

**Progress:** 1 of 6 phases complete

## Phase 1 — Session

**Status:** complete

**Goal:** the client holds a real session, and `requireAuth` actually guards a route.

**Skills to load:** `auth-and-ownership`, `learning-path-architecture`

**Files:**

```text
server/routes/auth.routes.js          add /me and /logout, both protected
server/controllers/auth.controller.js
server/services/auth.service.js
client/src/api/auth.api.js            attach the Bearer token
client/src/hooks/useAuthSession.js    new: rehydrate and hold the session
client/src/hooks/useAuthForm.js       stop discarding the session
```

**Endpoints:** `GET /api/auth/me`, `POST /api/auth/logout` — both `requireAuth`.

**Exit criteria:**

- `GET /api/auth/me` with no token returns `401 UNAUTHENTICATED`.
- `GET /api/auth/me` with a valid token returns the caller's user object.
- Sign in, reload the browser, and still be signed in. The token survived.
- Sign out, and `/me` returns `401` again.
- Nothing but the session token is in `localStorage`. No Supabase credential, no
  service-role key, no Gemini key.
- The error envelope is intact for all of the above.

### Known limitation carried into later phases

Only the **access token** is stored, not the refresh token. Supabase access tokens last
about an hour, and a stateless JWT cannot be revoked server-side, so:

- After roughly an hour the next request returns `401`, the client clears the stored
  session, and the user signs in again.
- `POST /api/auth/logout` confirms the sign-out but cannot invalidate the token it was
  given. A token replayed after logout still works until it expires. This was observed
  deliberately during verification, not assumed.

Revoking properly means either storing the refresh token and exchanging it server-side,
or keeping a deny list. Both are small, and both are worth doing before this has real
users. They are not in a phase yet.

## Phase 2 — Generation API

**Status:** not started

**Goal:** a validated path can be generated and stored from the command line.

**Skills to load:** `ai-path-generation`, `auth-and-ownership`, `learning-path-architecture`

**Files:**

```text
server/config/gemini.js               new: reads GEMINI_API_KEY
shared/validation.js                 path request schema, aiPathSchema
server/services/path.service.js      new: the parse-validate-repair pipeline
server/repositories/path.repository.js new: three-level insert with rollback
server/routes/path.routes.js         new: POST /api/paths, protected
server/controllers/path.controller.js new
```

**Endpoints:** `POST /api/paths` — protected.

**Exit criteria:**

- With `GEMINI_API_KEY` unset, the endpoint returns `503 AI_NOT_CONFIGURED` and writes
  nothing.
- An authenticated `POST /api/paths` with a real key returns a path of 4 to 12 steps,
  each carrying `title`, `description`, `estimated_time`, and a `resources` array.
- The database holds exactly one `learning_paths` row with `status = 'active'`, `N`
  `steps` rows numbered `1..N`, and `resources` rows attached to the right `step_id`s.
- A `skill_level` outside `beginner|intermediate|advanced` is rejected by Zod as a
  `400 VALIDATION_ERROR` with a populated `fields` object, **not** a raw database error.
- A `user_id` in the request body is ignored. The path is owned by the token's identity.
- A forced malformed model response returns `502 AI_INVALID_RESPONSE` and leaves
  **zero** rows behind — no empty path, no orphan steps.

## Phase 3 — Read & progress API

**Status:** not started

**Goal:** the whole stored-path surface exists and is provably isolated per user.

**Skills to load:** `auth-and-ownership`, `learning-path-architecture`

**Files:** `server/repositories/path.repository.js`, `server/services/path.service.js`,
`server/controllers/path.controller.js`, `server/routes/path.routes.js`

**Endpoints:**

```text
GET    /api/paths                            list the caller's paths, newest first
GET    /api/paths/:id                        steps in order, with their resources
PATCH  /api/paths/:id/steps/:stepId          toggle completion
DELETE /api/paths/:id                        cascades via ON DELETE CASCADE
```

All four protected.

**Exit criteria:**

- `GET /api/paths` returns only the caller's own paths, and never anyone else's.
- `GET /api/paths/:id` returns steps in `step_order` with their resources attached.
- `PATCH` sets `is_completed`, `completed_at`, and `updated_at` together. A follow-up
  `GET` shows the change persisted. This is the check that catches the missing
  `updated_at` trigger.
- A second user's token against someone else's path id returns `404 PATH_NOT_FOUND`,
  with a body indistinguishable from a genuinely nonexistent id. Not `403`.
- `DELETE` removes the path, and its steps and resources go with it through the
  cascade. Confirm the row counts afterwards.
- Every endpoint returns `401` unauthenticated.
- No endpoint leaks a stack trace, SQL, or a raw provider payload.

## Phase 4 — Client shell & generate form

**Status:** not started

**Goal:** generate a path from the browser.

**Skills to load:** `client-views-and-theming`, `auth-and-ownership`

**Files:**

```text
package.json                            add react-router-dom
client/src/main.jsx                     mount the router
client/src/App.jsx                      route table, nothing else
client/src/components/RequireAuth.jsx   new
client/src/pages/GeneratePage.jsx       new
client/src/hooks/usePathGeneration.js   new: idle/loading/success/error
client/src/api/path.api.js              new
client/src/components/                  reuse FormAlert, SubmitButton, AuthField
```

**Endpoints:** consumes `POST /api/paths` and `POST /api/auth/logout`.

**Exit criteria:**

- Routes `/login`, `/`, `/generate`, `/paths/:id`, `/dashboard`, and `*` are declared.
- A signed-out visitor to a protected route is sent to `/login` with **no flash** of the
  login screen first, because `RequireAuth` waits for rehydration.
- Signing in lands on `/generate`.
- Submitting shows a loading state, and a second submit while loading is ignored.
- An API failure renders in `FormAlert` with the envelope's message. An invalid field
  shows an inline error, which clears when that field is edited.
- `skill_level` is a three-option select matching the enum, not free text.
- Posting a bad body straight to the API still returns `400`. Client validation is a
  convenience, not the boundary.
- `npm run build` is green.

## Phase 5 — Roadmap & progress UI

**Status:** not started

**Goal:** the complete loop — generate, tick steps off, watch progress, start over.

**Skills to load:** `client-views-and-theming`

**Files:** `client/src/pages/PathPage.jsx`, `client/src/components/StepCard.jsx`,
`client/src/components/ProgressBar.jsx`, `client/src/components/ResourceList.jsx`,
`client/src/hooks/usePathGeneration.js`, `client/src/api/path.api.js`

**Endpoints:** consumes `GET /api/paths/:id`, `PATCH .../steps/:stepId`, and
`POST .../steps/:stepId/regenerate`.

**Exit criteria:**

- Steps render in `step_order`, visibly numbered, with `estimated_time` shown.
- Each step lists its resources with a `type` badge. A step with no resources shows
  nothing at all — no empty box, no placeholder text.
- Ticking a step shows all three completion signals at once: a filled checkmark, a
  struck-through title, and a colour change. Colour is not the only signal.
- Completion survives a reload.
- The progress bar shows "N of M", derived from the loaded steps.
- A failed write does **not** show the step as done. Optimistic UI must be reverted.
- Single-step regeneration replaces only that step, keeps its position, keeps its
  completed state, and replaces its resources rather than duplicating them.
- "Start over" generates a new path and leaves no stale roadmap on screen.
- `npm run build` is green.

## Phase 6 — Dashboard, theming, docs

**Status:** not started

**Goal:** the app hangs together and is documented.

**Skills to load:** `client-views-and-theming`, `verification-checklist`

**Files:** `client/src/pages/DashboardPage.jsx`, `client/src/styles.css`,
`client/index.html`, `README.md`

**Endpoints:** consumes `GET /api/paths`.

**Exit criteria:**

- `/dashboard` lists the signed-in user's paths newest first, each with its goal,
  status, and completion count, linking to `/paths/:id`.
- One honest empty state when the user has no paths, pointing at `/generate`.
- No other user's paths appear.
- The dark toggle persists across a reload with no flash of the wrong theme, and
  defaults to `prefers-color-scheme` when no preference is stored.
- `README.md` describes the real structure, every endpoint, and states that quizzes and
  prerequisites are deliberately absent.
- Any stretch goal that shipped has acceptance criteria written down.
- Final pass: `npm run build` green, every endpoint exercised by hand, and row counts
  in `learning_paths`, `steps`, and `resources` left clean.
