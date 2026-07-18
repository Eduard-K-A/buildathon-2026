# GabAI Web

GabAI study companion — a responsive Vite + React SPA backed by an Express API that uses OpenAI models (GPT-OSS + Whisper) for tutoring, question generation, and speech-to-text.

**Live demo:** https://buildathon-2026-web.vercel.app

## Product

GabAI turns any learning material into an interactive review session. A student uploads a PDF or pastes their notes; Gabi (the AI tutor) analyzes the material and builds a practice quiz from it.

**Features**

- **Material analysis** — detects the subject, topic, grade level, language, and key topics, and recommends the best question types for the material.
- **Custom reviewer** — beyond the recommended setup, students can steer generation: focus topics, difficulty (easy/medium/hard), an exact per-type question mix, and free-text instructions like "focus on dates and definitions".
- **Socratic tutoring** — wrong answers get guided hints instead of instant answers; Gabi detects the student's tone (confident, confused, frustrated) and adapts its feedback.
- **Voice-first studying** — answer by speaking (Whisper speech-to-text) and have questions and feedback read aloud, enabling hands-free review.
- **Multilingual** — works in English, Filipino, or natural Taglish, matching the student's language automatically.
- **Session summary** — a score, topics covered, and weak areas with pointers back to the source material, plus an encouragement message.

**Why it helps students learn**

Rereading notes is passive; GabAI converts the same notes into active recall practice — the most reliable way to retain material — in under a minute, with zero quiz-writing effort. Socratic hints keep students reasoning instead of memorizing answers, difficulty and focus-topic controls let them drill exactly where they're weak, and the end-of-session weak-area report tells them what to study next. Voice input and Filipino/Taglish support lower the barrier for students who study better by talking or in their own language.

## System overview

- The **web app** (`apps/web`) handles the study flow: source upload → analysis → reviewer setup (with optional customization) → practice session → summary. Session state lives in a React context.
- The **API server** (`apps/server`) exposes routes for documents, question generation, tutor turns, speech-to-text, and summaries. All AI calls go through a provider abstraction (`src/providers/`) so models can be swapped without touching services.
- **Shared Zod schemas** (`packages/shared`) define every request/response contract and are enforced on model outputs via strict JSON-schema structured outputs — the client, server, and model all agree on shapes at compile time and runtime.

## Structure

- `apps/web` — Vite + React 19 + React Router frontend (`@gabai/web`)
- `apps/server` — Express 5 API server (`@gabai/server`)
- `packages/shared` — shared Zod schemas (`@gabai/shared`)

## Setup

Requires Node.js 20+.

```bash
npm install
```

Create `apps/server/.env` from the example and fill in your API key:

```bash
cp apps/server/.env.example apps/server/.env
```

Then edit `apps/server/.env`:

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | API server port | `4000` |
| `AI_PROVIDER` | AI provider identifier | `openai` |
| `OPENAI_API_KEY` | Your API key (never commit this) | `sk-...` |
| `OPENAI_MODEL_PRIMARY` | Main reasoning model for tutoring turns, summaries, and question generation | `openai/gpt-oss-120b` |
| `OPENAI_MODEL_FAST` | Smaller, faster model for lightweight turns | `openai/gpt-oss-20b` |
| `OPENAI_STT_MODEL` | Whisper model for speech-to-text transcription | `whisper-large-v3-turbo` |
| `SESSION_TTL_MINUTES` | Tutor session lifetime | `30` |

The server validates all of these at boot (`apps/server/src/env.ts`) and refuses to start with missing or placeholder values, so misconfiguration fails fast instead of at request time.

## Run

Two terminals:

```bash
npm run dev:server   # Express API on http://localhost:4000
npm run dev:web      # Vite dev server on http://localhost:5173
```

Open http://localhost:5173. The Vite dev server proxies `/api` and `/health` to the API server, so no frontend env vars are needed in development. For a production build pointing at a remote API, set `VITE_API_BASE_URL`.

Sanity check the API:

```bash
curl http://localhost:4000/health
```

## Other scripts

```bash
npm run typecheck    # typecheck all workspaces
npm run build:web    # production build of the web app
```

## How OpenAI models power the app

- **GPT-OSS 120B** (`OPENAI_MODEL_PRIMARY`) drives the core tutoring loop: tutor turns (`tutor-turn.service.ts`), document summaries (`summary.service.ts`), and quiz/question generation (`question-generation.service.ts`), all with strict JSON-schema structured outputs validated by shared Zod schemas.
- **GPT-OSS 20B** (`OPENAI_MODEL_FAST`) handles latency-sensitive turns where a smaller model keeps the conversation snappy.
- **Whisper** (`OPENAI_STT_MODEL`, `whisper-large-v3-turbo`) transcribes the student's voice input (`stt.service.ts`), enabling the hands-free study flow.

## How Codex and GPT-5.6 accelerated the build

Codex (running GPT-5.6) was used throughout planning and implementation of this repository:

- **Planning and repository scaffolding** — Codex helped plan the monorepo layout (npm workspaces split into `apps/web`, `apps/server`, `packages/shared`) and scaffolded the initial project structure, configs, and workspace wiring.
- **Key decision: provider abstraction** — the AI layer sits behind an `AIProvider` / `STTProvider` interface (`apps/server/src/providers/`), a design decision worked through with Codex so models can be swapped without touching route or service code.
- **Key decision: schema-first API** — request/response contracts live as shared Zod schemas in `packages/shared`, consumed by both the Express server and the React client, and enforced on model outputs via strict JSON-schema response formats. Codex accelerated writing and aligning these schemas across the stack.
- **Key decision: fail-fast env validation** — environment configuration is parsed with Zod at boot rather than checked ad hoc, a pattern Codex helped implement.
- **Frontend port** — GPT-5.6 accelerated porting the original Expo app's screens, design tokens, and components to a responsive Vite + React web app.
