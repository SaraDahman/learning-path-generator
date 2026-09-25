# Pathway — Learning Path Generator

Full-stack authentication starter with an Express API, React/Tailwind frontend,
and Supabase Auth. Zod schemas are shared between the client and the server.

The build is organised into six phases in [PHASES.md](PHASES.md). Project rules live
in `.agents/skills/` and are loadable with the `skill` tool.

## Run locally

1. `npm install`
2. `cp .env.example .env` and fill in the three Supabase values plus `GEMINI_API_KEY`.
3. `npm run dev` — one process on port `5055` serving both API and UI.

Open http://localhost:5055. Port 5000 is unusable on macOS (AirPlay Receiver
holds it), which is why the default is 5055. Override with `PORT=8080 npm run dev`.

`npm run build` compiles the client into `client/dist`; `npm start` serves that
build statically. Build before starting in production mode.

## Project structure

```text
server/                    Express API (see .agents/skills/learning-path-architecture.md)
  config/supabase.js       Reads credentials from .env; the only place env is read
  controllers/             HTTP <-> service translation only
  services/                Auth workflows, throws AppError on expected failures
  repositories/            Only persistence layer; maps provider errors safely
  routes/                  Path and middleware declarations only
  middleware/              auth.middleware.js, error.middleware.js
  errors/AppError.js       The only error type the client sees
  index.js                 Composition root; hosts Vite in dev, dist in prod

client/                    React + Vite + Tailwind v4
  src/App.jsx              Root component, renders the auth page
  src/pages/               Route-level pages (AuthPage.jsx)
  src/components/          Presentational UI pieces (AuthForm, AuthField, HeroPanel, ...)
  src/hooks/               useAuthForm.js owns form state, validation and submit
  src/api/                 auth.api.js wraps the /api/auth calls
  src/styles.css           Tailwind v4 entry (@import "tailwindcss") + custom classes

shared/validation.js       Source of truth for signupSchema / loginSchema
```

Backend dependencies flow one way: `routes -> controller -> service ->
repository -> config/supabase.js`. The client never imports from `server/`, and
never talks to Supabase directly — only to `/api/...` on the same origin.

## Auth API

- `POST /api/auth/register` accepts `{ username, email, password }`, calls
  Supabase Auth `signUp`, then creates the matching `public.profiles` row
  (rolling the Auth user back if the insert fails).
- `POST /api/auth/login` accepts `{ email, password }` and calls
  `signInWithPassword`.
- `GET /api/health` returns `{ ok: true }` and needs no Supabase config.

Both write endpoints validate their bodies with the shared Zod schemas. Errors
are always returned as `{ error: { code, message, requestId, fields? } }`. The
service role key is server-only and never reaches the frontend.
