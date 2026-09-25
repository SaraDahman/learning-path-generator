---
name: learning-path-architecture
description: Defines the Learning Path Generator's strict React/Vite/Tailwind client, Express/Zod server, Supabase repository layers, shared validation, and mandatory error handling. Use for every project refactor or backend change.
---

# LearningPathArchitecture

This is the required architecture for the Learning Path Generator. Keep the project limited to React with Vite/Tailwind CSS on the client and Node.js with Express/Zod on the server. Do not add AI components, new forms, new views, or unrelated features while applying this blueprint.

## Exact layout

Application source files must follow this map:

```text
├── server/                    # Backend Engine
│   ├── config/
│   │   └── supabase.js
│   ├── controllers/
│   │   └── auth.controller.js
│   ├── errors/
│   │   └── AppError.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── repositories/
│   │   └── user.repository.js
│   ├── routes/
│   │   └── auth.routes.js
│   ├── services/
│   │   └── auth.service.js
│   └── index.js
│
├── client/                    # Frontend React Client (Vite Structure)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
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

Supporting client assets such as `client/src/styles.css` and `client/public/favicon.svg` remain inside `client/`. Environment examples and generated build output are not application source and must not be moved into the source map.

## Layer responsibilities

All backend dependencies follow this direction:

```text
auth.routes.js
  -> auth.controller.js
    -> auth.service.js
      -> user.repository.js
        -> server/config/supabase.js
          -> @supabase/supabase-js
```

### `server/index.js`

- Is the Express composition root.
- Configures JSON parsing, request IDs, API routes, the Vite middleware/static client, API 404 handling, and final error handling.
- Does not contain authentication workflows or Supabase queries.
- Must listen on `0.0.0.0` and port `process.env.PORT || 5000`.

### `server/routes/auth.routes.js`

- Owns only `/register` and `/login` route declarations and middleware order.
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

### `client/`

- Contains the entire React/Vite frontend and nothing from the server layers.
- `client/src/App.jsx` preserves the existing login/signup screen.
- `client/src/main.jsx` is the React entry point.
- `client/src/components/` contains reusable UI components only.
- `client/src/pages/` contains route-level pages only; do not add new views during a structure-only refactor.
- Frontend schemas must come from `shared/validation.js`; do not duplicate signup/login schemas in the client.
- Use relative `/api/...` requests. Never hardcode localhost or Supabase secrets in client code.

## `AppError` contract

`server/errors/AppError.js` must export a custom class extending `Error`.

Every `AppError` includes:

- `statusCode`: safe HTTP status, default `500`
- `code`: stable uppercase machine-readable code
- `message`: user-safe message
- optional `details`: internal validation/provider details, never serialized blindly
- `isOperational`: whether the message is safe to return

Expected codes include `VALIDATION_ERROR`, `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `CONFLICT`, `NOT_FOUND`, `SUPABASE_NOT_CONFIGURED`, `SUPABASE_AUTH_ERROR`, `PROFILE_CREATE_FAILED`, and `INTERNAL_ERROR`.

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

## Shared validation

`shared/validation.js` is the source of truth for the existing auth request contracts:

- Signup: required trimmed username, valid email, password with at least 6 characters.
- Login: valid email and password with at least 6 characters.

The server and client must import these schemas instead of defining copies.

## Structure-only change rules

- Do not add product behavior, AI integrations, forms, pages, views, or new endpoints.
- Preserve the existing login/signup UI and API behavior while moving files.
- Do not change Supabase table schemas or RLS policies during a file-structure refactor.
- After changes, run `npm run build`, restart the application workflow, check `/api/health`, and confirm the preview loads.