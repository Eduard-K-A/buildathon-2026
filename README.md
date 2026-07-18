# GabAI Web

Web rebuild of the GabAI study companion — same design system, components, and Express + Groq backend as the original Expo app, rebuilt as a responsive Vite + React SPA.

## Structure

- `apps/web` — Vite + React 19 + React Router frontend (`@gabai/web`)
- `apps/server` — Express 5 + Groq API server (`@gabai/server`, copied from the original repo)
- `packages/shared` — shared Zod schemas (`@gabai/shared`)

## Setup

```bash
npm install
```

Create `apps/server/.env` from the example and fill in your Groq credentials:

```bash
cp apps/server/.env.example apps/server/.env
# then edit apps/server/.env — set GROQ_API_KEY and the model names
```

If you already have a working `.env` in the original repo, copy it:

```bash
cp ../feu-techsprint/apps/server/.env apps/server/.env
```

## Run

Two terminals:

```bash
npm run dev:server   # Express API on http://localhost:4000
npm run dev:web      # Vite dev server on http://localhost:5173
```

The Vite dev server proxies `/api` and `/health` to the API server, so no frontend env vars are needed in development. For a production build pointing at a remote API, set `VITE_API_BASE_URL`.

## Other scripts

```bash
npm run typecheck    # typecheck all workspaces
npm run build:web    # production build of the web app
```
