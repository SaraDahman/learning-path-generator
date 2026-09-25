---
name: learning-path-architecture
description: Binding structure and layering rules for the Learning Path Generator - routes to controller to service to repository to config on the Express server, the required file layout, shared Zod validation, and AppError-only error handling. Use for any backend change, new endpoint, new repository or service, or refactor. This skill governs structure only and does not decide feature scope; see the sibling skills for what to build.
---

# LearningPathArchitecture

This is the required architecture for the Learning Path Generator. The stack is fixed: React with Vite/Tailwind CSS on the client, Node.js with Express/Zod on the server, Supabase for auth and persistence.

## Scope

This blueprint governs **structure and layering only**. It is not a feature freeze.

Earlier revisions of this file instructed agents not to add "AI components, new forms, new views, or unrelated features". That instruction is **withdrawn**. New endpoints, services, repositories, pages, and AI integrations are expected and welcome, provided they obey the layer direction and error contract below.

What this skill does still constrain:

- The stack does not change. No Next.js, no ORM, no additional database.
- Adding a feature never justifies a new layer or a shortcut around the direction chain.
- The file layout map is authoritative; extend it when you add files rather than scattering them.

Feature scope lives in the sibling skills. Read the one matching what you are building:

| Skill | Governs |
| --- | --- |
| `auth-and-ownership` | Sessions, `requireAuth`, per-user data isolation |
| `ai-path-generation` | Gemini calls, response validation, persistence |
| `client-views-and-theming` | Routes, components, dark mode |
| `verification-checklist` | How to prove a change works |

## Exact layout

Application source files must follow this map:

```text
├── server/                    # Backend Engine
│   ├── config/
│   │   ├── gemini.js
│   │   └── supabase.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── path.controller.js
│   ├── errors/
│   │   └── AppError.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── repositories/
│   │   ├── path.repository.js
│   │   └── user.repository.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── path.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   └── path.service.js
│   └── index.js
│
├── client/                    # Frontend React Client (Vite Structure)
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth.api.js
│   │   │   └── path.api.js
│   │   ├── components/
│   │   ├── hooks/
│   │   │   ├── SessionContext.jsx
│   │   │   ├── useAuthForm.js
│   │   │   ├── useAuthSession.js
│   │   │   └── usePathGeneration.js
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── shared/                    # Shared Guardrails
│   └── validation.js
│
├── package.json
└── README.md
```

The `api/` and `hooks/` client directories are not optional extras. Every client file that calls `fetch` lives in `api/`; every file that holds React state lives in `hooks/`. A component that fetches for itself is a layer violation.

Supporting client assets such as `client/src/styles.css` and `client/public/favicon.svg` remain inside `client/`. Environment examples and generated build output are not application source and must not be moved into the source map.

## Layer responsibilities

All backend dependencies follow this direction:

```text
auth.routes.js                path.routes.js
  -> auth.controller.js        -> path.controller.js
    -> auth.service.js           -> path.service.js
      -> user.repository.js        -> path.repository.js
        -> server/config/supabase.js   -> server/config/gemini.js
          -> @supabase/supabase-js
```

The two chains are independent and never cross. `path.service.js` does not call `auth.service.js`, and no route reaches a sibling route's controller.

### `server/index.js`

- Is the Express composition root.
- Configures JSON parsing, request IDs, API routes, the Vite middleware/static client, API 404 handling, and final error handling.
- Does not contain authentication workflows, Supabase queries, or AI calls.
- Must listen on `0.0.0.0` and port `process.env.PORT || 5055`. Never restore the `5000` default: macOS AirPlay Receiver holds `*:5000` and a bind failure there looks like a broken client.

### `server/routes/auth.routes.js`

- Owns only the auth route declarations and middleware order: `/register`, `/login`, `/me`, and `/logout`.
- `/register` and `/login` are public. `/me` and `/logout` are protected with `requireAuth`.
- Uses shared Zod schemas from `shared/validation.js`.
- Uses `asyncHandler` and request validation from `server/middleware/error.middleware.js`.
- Must not call Supabase or contain business logic.

### `server/controllers/auth.controller.js`

- Translates HTTP requests into service calls and service results into HTTP responses.
- Reads only validated request data.
- Must not import Supabase, access repositories, or implement business rules.
- Must not return ad hoc error JSON or use generic try/catch blocks.

### `server/services/auth.service.js`

- Owns signup and login workflows.
- Calls the repository, not Supabase directly.
- Returns plain application data, never Express `req`/`res`.
- On signup, creates Auth first, creates the matching profile second, and removes the Auth user if profile creation fails.
- Throws `AppError` for expected operational failures.

### `server/repositories/user.repository.js`

- Is the only auth/profile persistence layer.
- Uses `getPublicSupabase()` for `signUp` and `signInWithPassword`.
- Uses `getAdminSupabase()` only on the server for the protected `profiles` insert and Auth cleanup.
- Maps provider failures to safe `AppError` instances.
- Never exposes the service-role key, raw Supabase errors, or database details to the client.

### `server/config/supabase.js`

- Reads `SUPABASE_URL`, `SUPABASE_ANON_KEY`/`SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Exports client factories; do not hardcode credentials or URLs.
- Fails explicitly when configuration is missing.
- The service-role client must never be imported by browser code or bundled by Vite.

### `server/routes/path.routes.js`

- Owns only the `/api/paths` route declarations and middleware order.
- Every route in this file is protected with `requireAuth`. There are no public path routes.
- Uses shared Zod schemas from `shared/validation.js` for body and param validation.
- Uses `asyncHandler` from `server/middleware/error.middleware.js`.
- Must not call Supabase, Gemini, or a repository, and must not contain business logic.

### `server/controllers/path.controller.js`

- Translates HTTP requests into `path.service.js` calls and service results into HTTP responses.
- Reads only validated request data, and the user identity only from `req.user`.
- Must not import Supabase, Gemini, or repositories, and must not implement business rules.
- Must not return ad hoc error JSON or use generic try/catch blocks.

### `server/services/path.service.js`

- Owns learning path generation, retrieval, progress, and regeneration workflows.
- Calls `path.repository.js` for persistence and the Gemini client for model calls; never Supabase directly.
- Returns plain application data, never Express `req`/`res`.
- Throws `AppError` for every expected failure, including AI failures and ownership failures.
- Is the only place that decides what a valid AI response is allowed to become.

### `server/repositories/path.repository.js`

- Is the only persistence layer for `learning_paths`, `steps`, and `resources`.
- Uses the admin Supabase client, always scoped by the verified user id.
- Maps provider failures, including Postgres enum and constraint violations, to safe `AppError` instances.
- Never exposes the service-role key, raw Supabase errors, SQL, or database details to the client.

### `server/config/gemini.js`

- Reads `GEMINI_API_KEY` and the model id, and exports a single generation function.
- Is the only place Gemini credentials are read. The key is server-only and must never be renamed to a `VITE_*` variable, because Vite would inline it into the client bundle.
- Fails explicitly with `503 AI_NOT_CONFIGURED` when the key is missing, matching how `supabase.js` fails.

### `client/`

- Contains the entire React/Vite frontend and nothing from the server layers.
- `client/src/main.jsx` is the React entry point; `client/src/App.jsx` is the router shell.
- `client/src/api/` is the only place that calls `fetch` and the only place that reads the session store. A component that fetches for itself is a layer violation.
- `client/src/hooks/` holds all React state. `SessionContext.jsx` owns the authenticated session and is mounted once in `main.jsx`; `useAuthSession.js` is the consumer. A component that owns form or data state directly is a layer violation.
- `client/src/components/` contains reusable UI components only.
- `client/src/pages/` contains route-level pages only. Pages compose components; they do not define leaf markup.
- Frontend schemas must come from `shared/validation.js`; do not duplicate any schema in the client.
- Use relative `/api/...` requests. Never hardcode localhost or Supabase secrets in client code.

## Data model

Four tables, and only four. The application does not create, alter, or drop them, and there is no migration runner in this project; schema changes are made by hand in the Supabase SQL editor.

| Table | Role |
| --- | --- |
| `profiles` | The user entity. `id` has no default and is populated from the Supabase auth user id. |
| `learning_paths` | One generated path. `user_id` FKs to `profiles.id`. |
| `steps` | Ordered steps. `learning_path_id` FKs to `learning_paths.id`. |
| `resources` | Per-step links. `step_id` FKs to `steps.id`. |

Facts that constrain the code and are easy to get wrong:

- **Enums are real Postgres enums**, not free text. `learning_paths.skill_level` is `beginner|intermediate|advanced`, `learning_paths.status` is `draft|active|completed`, and `resources.type` is `article|course|video|documentation|other`. These exact values must appear in the Zod schemas; a mismatch only surfaces at insert time as a raw Postgres error. See `ai-path-generation`.
- **`skill_level` defaults to `beginner` and `status` defaults to `draft`.** The product has no draft concept, so new paths must set `status` to `'active'` explicitly rather than relying on the default.
- **Every foreign key is `ON DELETE CASCADE`.** Deleting a `learning_paths` row removes its steps and their resources automatically. No manual teardown code, and no orphaned rows to defend against.
- **There is no `updated_at` trigger.** The `updated_at` columns have a `DEFAULT CURRENT_TIMESTAMP` but nothing refreshes them, so any `UPDATE` must set `updated_at` explicitly or it silently keeps a stale value.
- `resources` has no `updated_at` at all, so replacing a step's resources is delete-then-insert, never upsert.
- Indexes exist on `learning_paths.user_id`, `steps.learning_path_id`, and `resources.step_id`, so per-user scoping is index-backed.
- `estimated_time` and `time_commitment` are `TEXT`, not intervals. They hold human strings such as `"about 2 hours"`.
- There is **no quiz data anywhere in this schema**, and quizzes are not a planned feature. Do not design around them.
- There is **no column for prerequisites**. It is not a stored feature; do not write code that expects one.

## `AppError` contract

`server/errors/AppError.js` must export a custom class extending `Error`.

Every `AppError` includes:

- `statusCode`: safe HTTP status, default `500`
- `code`: stable uppercase machine-readable code
- `message`: user-safe message
- optional `details`: internal validation/provider details, never serialized blindly
- `isOperational`: whether the message is safe to return

Expected codes include `VALIDATION_ERROR`, `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `CONFLICT`, `NOT_FOUND`, `SUPABASE_NOT_CONFIGURED`, `SUPABASE_AUTH_ERROR`, `PROFILE_CREATE_FAILED`, and `INTERNAL_ERROR`.

The learning path feature adds `AI_NOT_CONFIGURED` (`503`), `AI_REQUEST_FAILED` (`502`), `AI_INVALID_RESPONSE` (`502`), and `PATH_NOT_FOUND` (`404`). `PATH_NOT_FOUND` is the response for both a genuinely missing path and one belonging to another user; see `auth-and-ownership`.

Codes are part of the public contract. The client branches on them, so rename a code only together with every client call site.

## Shared validation

`shared/validation.js` is the single source of truth for every contract crossing a boundary. It holds request schemas that the server enforces and the client reuses, plus the AI response schema.

Request contracts:

- Signup: required trimmed username, valid email, password with at least 6 characters.
- Login: valid email and password with at least 6 characters.
- Path generation: career goal, skill level from the `skill_level` enum, optional background, and time commitment.
- Step completion: a boolean completion flag.
- Step regeneration: nothing beyond the path and step ids in the URL.

Response contracts:

- `aiPathSchema` validates the model's JSON before anything is persisted. Its step count, required fields, and resource shape are load-bearing, not advisory. See `ai-path-generation`.

Both the server and the client import these schemas. Never define a copy, and never validate the same payload two different ways.

## Mandatory middleware conventions

### `server/middleware/auth.middleware.js`

- Exports `requireAuth`.
- Reads a Bearer token from `Authorization`.
- Validates it with the public Supabase client.
- Stores the verified user on `req.user`.
- Calls `next(new AppError(...))` with `401` and `UNAUTHENTICATED` when the token is absent or invalid.
- It is reserved for protected routes and must not be added to public signup/login endpoints.

### `server/middleware/error.middleware.js`

It must export:

- `asyncHandler(handler)`: `Promise.resolve(handler(req, res, next)).catch(next)`
- `validateBody(schema)`: parses with Zod, replaces `req.body` with parsed data, and forwards validation failures
- `notFoundMiddleware`: creates a `404` `NOT_FOUND` `AppError` for unmatched API routes
- `errorMiddleware`: the only middleware that formats API errors

`errorMiddleware` must:

1. Run after all API routes and after the production SPA fallback.
2. Delegate to Express if headers were already sent.
3. Format Zod failures into field-level JSON.
4. Return this shape for all API errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check your details and try again.",
    "fields": {
      "email": "Enter a valid email address"
    },
    "requestId": "request-id"
  }
}
```

5. Return `400` for validation, `401` for authentication, `403` for authorization, `404` for missing routes, `409` for conflicts, and `500` for unexpected failures.
6. Return a generic `Something went wrong. Please try again.` message for non-operational failures.
7. Log request IDs and server-side causes without logging passwords, tokens, service keys, SQL, or raw provider payloads.
8. Never send stack traces or environment values to the client.

## Change rules

- New features, endpoints, services, repositories, pages, and AI integrations are expected. The layer direction and error contract above are not negotiable; the feature list is.
- Do not change the four-table Supabase schema as part of feature work. All four tables already exist and the data is currently empty, so the model is free to shape right now. A genuine schema change means the user runs SQL in the Supabase SQL editor; there is no migration runner here and no credential in `.env` that can execute DDL.
- When a new column is genuinely needed, get the user's SQL executed first, confirm the change by reading it back, and only then write code against it. Do not write code that depends on a column that does not exist yet.
- After changes, run `npm run build`, restart the server, check `/api/health`, and exercise the affected endpoints. See `verification-checklist`.