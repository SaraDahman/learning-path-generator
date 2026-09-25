---
name: verification-checklist
description: How to prove a change works in the Learning Path Generator, which has no test runner, lint, typecheck, or format script. Covers npm run build, the health check, endpoint curls, the mandatory server restart after server or .env changes, port 5055 and the 24678 HMR collision, checking Zod enums against the database, and confirming no orphan rows after a partial failure. Use before declaring any change done, and whenever a dev server seems stuck or a change appears to have no effect.
---

# VerificationChecklist

There is no automated test suite, no linter, and no typechecker in this project. "It works" is something you demonstrate, not something a command asserts. Do not claim a change is verified without having actually run these.

## The restart rule

**Configuration is read at module load, so a running server cannot pick up a change to `.env` or to anything in `server/`.** Restart the dev server after editing either. This has been mistaken for a broken change more than once.

Symptoms of a process that was not restarted:

- A new env var reads as `undefined` and the endpoint returns `503`.
- A newly added route returns `404` even though the file is correct.
- An old error message is returned after the code was changed.
- The page is blank and the console shows the previous bundle.

If a change appears to have no effect, restart before debugging anything else.

## Ports

- The app is on **`process.env.PORT || 5055`**. Never move it back to `5000`; macOS AirPlay Receiver holds `*:5000`, and a bind failure there presents as a blank page rather than an error.
- `client/vite.config.js`'s `server.port` is dead configuration. Vite runs in middleware mode inside Express, so that number is ignored.
- A second dev instance logs `WebSocket server error: Port 24678 is already in use`. That is the HMR socket colliding. Harmless to the app; kill the other instance.

## Before you claim it works

1. `npm run build` from the repo root. A green build is the minimum bar for any client change.
2. Restart `npm run dev`.
3. `curl -s localhost:5055/api/health` returns `{"ok":true}`. This proves the process booted. It says nothing about configuration, so never use it to check credentials.
4. Exercise every endpoint you touched with `curl`, and read the actual response body and status code.
5. Load the affected page and look at it.

## Endpoint checks worth running

Unauthenticated request to a protected route must be `401` with `UNAUTHENTICATED`, not a redirect and not a `500`:

```bash
curl -s -o /dev/null -w '%{http_code}\n' localhost:5055/api/paths
```

A request authenticated as user A against a path owned by user B must be `404 PATH_NOT_FOUND`. There is no `403` for ownership; see `auth-and-ownership`.

An invalid body must be `400 VALIDATION_ERROR` with a populated `fields` object, not a `500`:

```bash
curl -s -X POST localhost:5055/api/auth/login \
  -H 'Content-Type: application/json' -d '{"email":"nope"}'
```

A duplicate username or email must be `409 CONFLICT` naming the offending field, not a raw Postgres `23505`.

A missing Gemini key must be `503 AI_NOT_CONFIGURED`, and a missing Supabase config `503 SUPABASE_NOT_CONFIGURED`. Neither may reach the provider.

Every error response must have the envelope `{ error: { code, message, requestId } }` and must not contain a stack trace, SQL, an env value, or a raw provider payload.

## Enum alignment check

Whenever a Zod enum touches a database column, verify the values match. `skill_level` is `beginner|intermediate|advanced` and `resources.type` is `article|course|video|documentation|other`. A value that passes Zod but is not in the Postgres enum fails only at insert time, as a raw database error the client sees as `INTERNAL_ERROR`. Check it deliberately rather than stumbling on it.

## Database side effects

Queries against the real database leave rows behind. After probing:

- **Check row counts** for `learning_paths`, `steps`, and `resources`. All three were empty when this feature was built; a surprise row means a test run leaked.
- **Confirm no orphan rows after a partial failure.** A failed generation must leave no path behind - `path.service.js` deletes the path and the `ON DELETE CASCADE` chain takes the steps and resources with it.
- **Confirm no orphan auth users.** Registration creates the Auth user first and deletes it if the profile insert fails. After testing signup, check that no `auth.users` row exists without a matching `profiles` row.
- Clean up anything you created unless the user asked you to leave it.

## Manual passes that cannot be skipped

- **Generation:** submit the form, confirm a loading state, confirm a path with 4 to 12 ordered steps, and confirm each step's resources appear.
- **Malformed AI output:** confirm the server returns `502 AI_INVALID_RESPONSE` and persists nothing, rather than writing a partial path.
- **Ownership:** sign in as a second user and request the first user's path id. Confirm `404`.
- **Progress:** toggle a step, reload the page, and confirm the completed state survived. This is the check that catches a missing `completed_at` or a missing `updated_at` write.
- **Single-step regeneration:** regenerate a completed step and confirm it keeps its position and its completed state.
- **Dark mode:** toggle it, reload, and confirm no flash of the wrong theme.

## Optional: real tests

`node:test` is available with no new dependency, and `node --test` will run it. It is worth adding for the two pure functions where a bug is silent and expensive: the AI response parse pipeline in `path.service.js` and `aiPathSchema` in `shared/validation.js`. Both can be tested without a server, a key, or a database. It is not yet set up, and there is no `test` script in `package.json`; adding one is a deliberate step, not something to assume.
