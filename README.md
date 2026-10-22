# Futurelab AI Airport

The interactive learning world for Futurelab Studios' AI courses. It runs in the browser as a 3D app with two parts:

- **The airport.** The course *AI for Tech Professionals* drawn as an airport. Each module is a building; Terminal 1 (Module 01, software foundations) is open, with 8 lesson stations, quizzes, a module exam and a scoreboard.
- **The AI Systems Lab.** Programme 2, Level 1 (Foundations), taught through 13 interactive 3D models in a dark studio. You can change values, watch the model react, click any part for an explanation, follow a step-by-step walkthrough, and take a short quiz per episode.

A mentor character, Ravi, answers questions about the open lesson. He uses Claude when an API key is set, and the lesson notes when it isn't.

**Live preview:** https://claude.ai/artifact/SADD8YyytLmddQUKEV2wWk. This is a static build, so Ravi answers from the lesson notes there.

## Run it locally

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173. Click Terminal 1 for the airport lessons, or the glass **LAB** pavilion (or "Open the AI Systems Lab") for the 3D models.

To let Ravi answer with Claude, copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. The key stays on the dev server; it is never sent to the browser.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload, plus the `/api/mentor` route for Ravi |
| `npm test` | Runs all Vitest tests (models, content and progress rules) |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Production build into `dist/` |
| `npm run build:artifact` | Build with relative paths into `dist-artifact/`, for hosting as a static page |

## What's inside

```
docs/                  The brief and every decision made since. Start here.
content/               All course text and data (JSON). Edit lessons here, not in code.
src/
  app/                 App shell, theme and styles (styles.css, ui.css, lab.css)
  content/             Loaders and types for content/
  engine/              Camera, fly-in navigation, 3D-to-screen labels
  world/               The airport: ground, buildings, Terminal 1 interior, props
  ui/                  Airport panels: departures board, lesson steps, exam, scoreboard, chat
  lab/                 The AI Systems Lab
    models/<model>/    One folder per 3D model: logic.ts (tested) and View.tsx (3D scene and controls)
    ui/                Lab top bar, control dock, side sheet, labels
    primitives.tsx     Shared 3D building blocks and the lab palette
    registry.tsx       Which models exist and where each one's camera starts
  mentor/              Ravi's chat client and offline answers
  store/               Progress (saved in the browser) and UI state
server/                The /api/mentor route (Claude Haiku), run by the Vite dev server
```

### Docs

| File | What it covers |
| --- | --- |
| `docs/01-concept.md` | The idea: the airport as a working system, and how a station teaches |
| `docs/02-airport-map.md` | All 17 modules mapped to buildings |
| `docs/03-module-01.md` | Module 01 in detail: 8 stations, with the simulation rules for the Rebooking Desk |
| `docs/04-engine.md` | Technical design, folder layout and content format |
| `docs/05-build-plan.md` | Milestones and their status |
| `docs/curricula-p2-level1.md` | Programme 2, Level 1 source text that the lab teaches |
| `docs/decisions.md` | Every change to the brief and why. Add to it when you change direction. |
| `docs/screenshots/` | Screenshots from milestone reviews |

### Content (no code needed)

| File | What it holds |
| --- | --- |
| `content/modules.json` | The 17 modules (code, title, building, status) |
| `content/airport-layout.json` | Where every building, road and runway sits |
| `content/m01/lessons.json` | Terminal 1: 8 stations with brief, predict, lesson notes, quiz and stamp |
| `content/m01/exam.json` | The Module 01 exam (12 questions, 70% to pass) |
| `content/m01/interior.json` | Where each station sits inside Terminal 1 |
| `content/p2-l1/lessons.json` | The lab: 6 episodes, each with reading, 3D models, walkthrough steps, "Try this" tips and a quiz |
| `content/p2-l1/explain.json` | The short explanations shown when you click part of a 3D model |

Tests check that every model and walkthrough step in the content matches a 3D view, and that every quiz answer is valid. If you rename something, run `npm test`.

### The 13 lab models

| Episode | Model | Folder |
| --- | --- | --- |
| 1 · What makes AI agentic | Four kinds of AI system side by side | `system-types` |
| | The agent loop and the limit it needs | `agent-loop` |
| 2 · Thinking in systems | The context window as a stock with inflow and outflow | `stock-flow` |
| | A retry storm, and the brakes that stop it | `feedback-loops` |
| 3 · Inside the LLM | Inside a transformer: tokens, embeddings, attention heads, feed-forward, residual stream, softmax | `next-token` |
| | A tiny neural network with editable, trainable weights | `neural-net` |
| | How training finds weights (gradient descent on an error surface) | `loss-landscape` |
| | One API call end to end (401, 429, streaming, max_tokens) | `api-call` |
| 4 · The LLM as a component | Validate, retry once, fall back, hand to a person | `contract` |
| | Routing between a small and a large model | `routing` |
| 5 · Prompt design | The system prompt as sections, scored on a test set | `prompt-stack` |
| 6 · Context engineering | What fills the context window and what each technique removes | `context-window` |
| | Searching by meaning vs keywords on a 3D map of embeddings | `embedding-lookup` |

Each model is a small, honest teaching version and says so on screen. For example, the language model is trained on about 80 airline-support sentences. Every model's `logic.ts` is a pure, seeded function with tests proving its teaching point.

## Adding or changing a 3D model

1. Create `src/lab/models/<id>/logic.ts` (pure functions) with a test next to it.
2. Create `src/lab/models/<id>/View.tsx`, exporting a `View` (the 3D scene) and `Controls` (the dock controls). Build it from `src/lab/primitives.tsx` so it matches the lab's look. Pass `explain="..."` to make a part clickable.
3. Register it in `src/lab/registry.tsx` with a camera framing.
4. Add its text to `content/p2-l1/lessons.json` (stages and tips) and `content/p2-l1/explain.json`.
5. Run `npm test` and `npm run typecheck`.

## Stack

Vite, React 19, TypeScript, three.js with @react-three/fiber, drei and postprocessing, zustand and Vitest. Ravi's chat uses the Claude API (Claude Haiku) through a small server route. Everything renders in the browser with no downloaded 3D assets, so the build works as a single static site.

## Working together

- Work on a branch and open a pull request into `main`; run `npm test` before you push.
- Course text changes only need edits to `content/`.
- Record changes of direction in `docs/decisions.md`.
- Never commit `.env` (it's in `.gitignore`).
