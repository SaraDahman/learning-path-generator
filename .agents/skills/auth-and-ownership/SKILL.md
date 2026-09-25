---
name: auth-and-ownership
description: How authenticated requests and per-user data isolation work in the Learning Path Generator - the auth.users to profiles to learning_paths identity chain, requireAuth wiring, ownership scoping through resources and steps, 404 over 403, server-only Supabase access, and client session storage and rehydration. Use when adding or changing any protected endpoint, session handling, login, logout, or anything that reads or writes a user's learning paths.
---

# AuthAndOwnership

Every learning path belongs to exactly one person, and the server proves who that person is before touching a single row. This skill is the whole of that rule.

## The identity chain

There are three identifiers in play and they are easy to confuse:

```text
auth.users.id        Supabase Auth identity, minted at signup
  -> profiles.id     the app's user row, primary key, references auth.users ON DELETE CASCADE
    -> learning_paths.user_id   every path is owned by a profiles row
      -> steps.learning_path_id
        -> resources.step_id
```

The only trustworthy user identifier in a request is the one `requireAuth` resolved from the Bearer token. It is a **string** on `req.user.id`.

## Rules

- **`req.user.id` is the only source of identity.** Never read a user id from the request body, a query parameter, a route parameter, or a header the client controls. A `user_id` in a payload is untrusted input; ignore it, and ideally never accept it.
- **Scope every read and write by that id.** A query without a user filter is a data leak, even if the response is filtered afterwards. Filter in the database, not in JavaScript.
- **Ownership failures are `404 PATH_NOT_FOUND`, not `403`.** A `403` confirms the row exists, which is itself information. Answer exactly as if it did not exist.
- **There are no public path routes.** Every route in `path.routes.js` carries `requireAuth`. `learning_paths.user_id` is `NOT NULL`, so an unauthenticated request cannot even be represented.
- **No Supabase SDK in the browser.** The client never imports `@supabase/supabase-js`. All Supabase access happens server-side through repositories, using the service-role key. The client talks to `/api/...` with a Bearer token and nothing else.
- **Never trust the client for a row's owner.** The client may send a path id; the server resolves that id *within the caller's own rows* and treats anything else as missing.

## `requireAuth`

Defined in `server/middleware/auth.middleware.js`:

- Reads a Bearer token from the `Authorization` header.
- Validates it with the **public** Supabase client via `getUser(token)`.
- Stores the verified identity on `req.user`.
- On absent or invalid token, calls `next(new AppError(...))` with `401` and `UNAUTHENTICATED`.
- Must never be added to `/api/auth/register` or `/api/auth/login`.

Validate the token, do not decode it. A JWT is only trustworthy once Supabase has checked its signature and expiry.

## Scoping across three tables

`resources` has no user column, so ownership is reached by joining up to the path. In practice this means:

- **List a path's steps** - fetch steps by `learning_path_id`, but only after that path has been resolved as owned.
- **Read resources for a step** - resolve `step -> learning_path -> user_id` before returning anything.
- **Toggle or regenerate a step** - confirm the step belongs to a path owned by the caller, then act.
- **Listing a user's paths** - filter `learning_paths` by `user_id` directly, which is index-backed.

Prefer two small scoped queries over one clever join. A single query that fetches a step by id without a user filter and then filters in memory is a bug even when it happens to be correct today.

## Client session contract

The client keeps the session token and rehydrates it on load. It never holds Supabase credentials and never talks to Supabase directly.

- Store the access token and the authenticated flag in `localStorage` under a single namespaced key.
- `useAuthSession` reads that store on mount and calls `GET /api/auth/me` to confirm the token is still valid before reporting the user as signed in.
- `client/src/api/auth.api.js` attaches `Authorization: Bearer <token>` to every request and is the only file that reads the store to do so.
- Sign out calls `POST /api/auth/logout` and then clears the store. Do not clear local state without telling the server.
- A `401` from any endpoint means the token is dead: clear the store and send the user to the login route rather than retrying.

A localStorage token is readable by any script on the page. That is an accepted trade-off for this project because it removes the need for a browser Supabase client, but it is why no other secret may ever be placed in the browser. Never put the service-role key, the Gemini key, or any Supabase credential in client code, in `localStorage`, or in a `VITE_*` variable.

## Checklist for a new endpoint

1. Is it declared in `path.routes.js` (or `auth.routes.js`) with `requireAuth`?
2. Does the repository query filter by `req.user.id`, in the database?
3. Does a row owned by someone else produce `404 PATH_NOT_FOUND` rather than `403` or data?
4. Does the controller read the user only from `req.user`?
5. Does an expected failure throw an `AppError` rather than returning ad hoc JSON?
