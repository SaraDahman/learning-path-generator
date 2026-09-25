---
name: ai-path-generation
description: Rules for generating learning paths with Gemini and persisting the result in the Learning Path Generator - where GEMINI_API_KEY lives, fail-closed configuration, structured JSON output, the defensive parse-validate-repair-retry pipeline, aiPathSchema, the three-level path-steps-resources insert with rollback, Postgres enum alignment, and single-step regeneration. Use when touching server/config/gemini.js, path.service.js, path.repository.js, the generation prompt, or any Gemini call.
---

# AiPathGeneration

A model response is untrusted input. It is text from the internet that happens to be well formatted, and everything downstream assumes it has already been proven safe to store. This skill is how that proof happens.

## Where the key lives

`server/config/gemini.js` is the **only** file that reads `GEMINI_API_KEY`.

- Server-only, always. Never rename it to a `VITE_*` variable - Vite inlines `VITE_*` into the client bundle and the key would ship to every visitor.
- Missing key fails explicitly with `503 AI_NOT_CONFIGURED`, mirroring how `supabase.js` fails with `SUPABASE_NOT_CONFIGURED`. Do not fall back to a default, and do not let the request reach the model.
- The key is read at module load, so it must exist before the process starts. See `verification-checklist`.

## Model availability is not stable

Do not hardcode a single model id, and do not trust any id written here. Measured on
this project's free-tier key:

| model | result |
| --- | --- |
| `gemini-2.5-flash` | `404` - retired, not available to new users |
| `gemini-3.8-flash` | `503` on every attempt |
| `gemini-3.7-flash` | about 50% `503` |
| `gemini-3.5-flash` | works, but intermittently `503` |
| `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite` | reliable, and roughly 5x faster |

So `GEMINI_MODELS` is a **comma-separated fallback chain**, read at module load, and
`generateJson` walks it: one attempt per model, one retry on a retryable status
(`429`/`5xx`/timeout) before moving to the next, capped by a total attempt budget. A
single 404 on a retired id is the normal case, not an exception, so a 404 falls
through to the next model rather than ending the request.

When a generation fails, **read the server log line first**. It names each model and
the reason. Re-measure availability with `GET /v1beta/models` and a real
`generateContent` call rather than assuming the chain is still correct.

## Request discipline

- Request **structured JSON** via the response MIME type. Do not ask for prose and try to parse it.
- Attach a **30 second `AbortSignal`**. Generation that hangs is worse than generation that fails.
- Retry **once** on `429` and `5xx` with a short backoff, then fall through to the next model. Do not build an unbounded retry loop.
- A missing or rejected API key is a configuration problem, not a transient one. Never retry it.
- Never log the key, the full prompt, or the raw model response to the server log.

## The responseSchema is a subset, not JSON Schema

Gemini accepts a restricted schema dialect and rejects unknown keywords outright
rather than ignoring them. `additionalProperties` is a `400`, not a no-op. Stick to
`type`, `properties`, `required`, `items`, `enum`, and `description`.

This matters because a `responseSchema` largely eliminates the malformed-JSON case the
pipeline below defends against, which means **the repair path is easy to leave
untested**. It is still the thing that catches a wrong step count, and it has been
observed to fire on a real request: the model returned 5 steps against a 4-step bound,
validation rejected it, the repair prompt asked for 4, and the request succeeded.

## The defensive parse pipeline

The model is asked for JSON and often supplies it wrapped in markdown fences or a sentence of preamble. Run these steps in order, in `path.service.js`:

1. **Strip fences.** Remove a leading ` ```json ` / ` ``` ` and its trailing fence, and trim surrounding whitespace.
2. **Parse inside a `try`/`catch`.** A `JSON.parse` failure is expected, not exceptional.
3. **Validate with `aiPathSchema.safeParse`.** Structure, not just syntax.
4. **Repair once.** On failure, re-ask the model with the original request plus the specific validation errors, and run the whole pipeline again. Exactly one repair attempt.
5. **Give up cleanly.** If it still fails, throw `502 AI_INVALID_RESPONSE`.

**A malformed or partial model response must never reach the client, and never reaches the database.** No half-written path, no path with three steps when the schema demands four, no unvalidated string spliced into a row.

Log the failure server-side at `warn` with the request id and the validation issues, so a persistent schema mismatch is diagnosable. Log the raw response only if the user asks for it.

## Contracts

`shared/validation.js` holds both sides of the AI boundary.

Request shape, which the prompt builder also reads:

- `career_goal` - required, trimmed, max 255 to match the column.
- `skill_level` - required, and **must be one of** `beginner`, `intermediate`, `advanced`. These are the values of the `public.skill_level_type` Postgres enum, not free text.
- `background` - optional, nullable column.
- `time_commitment` - required string, stored in a `TEXT` column and shown to the user verbatim.

**The real column names are not what they look like.** They were read back from the
live PostgREST schema, not assumed. `learning_paths` has `career_goal`,
`background`, and `time_commitment` - there is no `title`, no `summary`, and no
`timeframe_weeks` integer. `steps` has `step_order` and a free-text `estimated_time`,
not `position` or `estimated_hours`. `resources` has **no** `learning_path_id`; it
hangs off `step_id`, so resources are nested per step in the AI response. Writing to
the intuitive names fails at runtime. Re-read the schema before adding a column.

Response shape, `aiPathSchema`:

- A list of **4 to 12 steps**. The bounds are deliberate: fewer is not a roadmap, more is not something anyone finishes.
- Each step requires `title` (max 255), `description`, and `estimated_time` as a human string such as `"about 2 hours"`.
- Each step carries a `resources` array, which may be empty but is always present. Every resource requires `title`, `url`, and `type`.
- `type` **must be** one of `article`, `course`, `video`, `documentation`, `other`, matching the `public.resource_type` enum.

## Enum alignment is the sharpest edge here

`skill_level` and `resources.type` are real Postgres enums. If Zod allows a value the enum does not, the insert fails at runtime with a raw database error that the client sees as `INTERNAL_ERROR` - not as a validation problem, and not during your testing if you happened to type a valid value.

So the enum values live in exactly one place, `shared/validation.js`, and the database must match. When you change a Zod enum, verify it against the database in the same change. See `verification-checklist`.

A `url` must be a well-formed absolute `http`/`https` URL. The schema should reject obvious junk such as `"see google"` or an empty string, because these are rendered as links the user will click.

## Three-level persistence

Generation produces three kinds of row, written in order, because each level needs the id of the one above it:

1. Insert `learning_paths` with the user's id and **`status: 'active'` set explicitly**. The column default is `draft` and this product has no draft concept, so relying on the default would leave every path stuck in `draft`.
2. Insert each `steps` row with `learning_path_id` and `step_order` numbered `1..n`, **collecting each returned `id`**.
3. Insert each `resources` row against the `step_id` it belongs to.

**Roll back on partial failure.** If the step or resource insert fails after the path was written, delete the path and rethrow. The `ON DELETE CASCADE` chain removes the steps and resources for you. Leaving an empty path behind for a user to find is worse than returning an error.

Set `updated_at` explicitly on any update - see `learning-path-architecture` for why nothing refreshes it for you.

## Single-step regeneration

Regenerating one step reuses the identical pipeline. It is not a shortcut around validation.

- Resolve the step through the ownership rules in `auth-and-ownership` before generating anything.
- Generate a replacement for **that step only**, and persist its resources too.
- `resources` has no `updated_at`, so replacing them is **delete-then-insert**, never upsert. Delete the step's existing resources in the same operation that inserts the new ones.
- Keep the step's position: the replacement occupies the original `step_order`. Do not renumber the path.
- Preserve the original `is_completed` and `completed_at`. Regenerating a step the user already finished should not silently un-finish it.
- A failure here leaves the original step intact; do not delete before you have a valid replacement.

## Regenerating a whole path

"Start over" creates a **new** path rather than mutating the old one, so the previous result is not destroyed by a mis-click. The client discards the old path id and takes the new one.

## What this feature does not do

- **No quizzes.** There is no quiz column in the schema and none is planned. Do not design, generate, or store one.
- **No prerequisites.** No column exists for them. If they ever appear, they are not persisted today; do not write code that expects a home for them.
- **No multiple variants.** One request produces one path.
