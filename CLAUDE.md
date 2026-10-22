# Futurelab AI Airport

You are building the learning world for **AI for Tech Professionals**, a paid course by Futurelab Studios (India). Read this file first, then the docs in order:

1. `docs/01-concept.md`: what we're building and how people learn in it
2. `docs/02-airport-map.md`: the airport layout, with all 17 modules mapped to airport buildings
3. `docs/03-module-01.md`: the first module in full detail (8 stations)
4. `docs/04-engine.md`: technical design, folder structure and content format
5. `docs/05-build-plan.md`: build order, milestones and acceptance checks
6. `content/modules.json`: module list in machine-readable form
7. `docs/decisions.md`: every change made to this brief and why. Add an entry whenever you change the brief.

## In one paragraph

The whole course is a 3D airport. Each module is a building (Terminal 1, the Baggage Hall, the Control Tower…). Each lesson is a station inside that building. The airport is the system being taught, not decoration. Passengers are requests, gates are API endpoints, flights to "Model City" are calls to the LLM provider, the rebooking desk is retry logic, and the control tower is observability. At a station the learner predicts, watches it break in 3D, watches a short video, fixes it with live controls, writes the real code, and answers a few questions. The finished station stays running in their airport.

## Non-negotiables

- **Learning first.** Every 3D object a learner can click must teach something: it can be inspected, changed, and seen to react. No decorative-only interactions.
- **Light theme only.** White and light grey architecture, blue glass accents, clean UI panels. No dark mode.
- **Professional, not childish.** Clean low-poly, soft daylight, restrained colour. It should look like a premium operations tool, like WareTrack, not a kids' game.
- **Plain language.** All on-screen text is short, direct and human. No marketing language.
- **Modular code.** Never one giant file. Engine, world, stations, simulations and UI live in separate folders (see `docs/04-engine.md`).
- **Content is data.** Modules, lessons, steps, questions and copy live in `content/`, not hard-coded in components. Adding Module 02 should mostly mean adding content plus one simulation per station.
- **Simulations are pure and tested.** Every station simulation is a pure TypeScript function with a seed, and has Vitest tests proving the teaching outcome. For example: "no timeout + slow provider → answered rate below 70%".
- **Works on a mid-range laptop at 60 fps.** Use instancing for passengers and bags. Offer a simple 2D map mode on phones.

## Stack

Vite + React + TypeScript, `three`, `@react-three/fiber`, `@react-three/drei`, `zustand`, `vitest`. Pyodide (in a Web Worker) for Python code steps. The Claude API, via a small server route, for the mentor character. Details are in `docs/04-engine.md`.

This starts as a standalone app. Later it will be embedded in the company website (Next.js) at `/ai-school/airport`.

## How to work

- Follow the milestones in `docs/05-build-plan.md` in order. Finish and verify each one before starting the next.
- The first real goal is a **vertical slice**: the airport overview, then flying into Terminal 1, then walking to the Rebooking Desk, then playing Lesson 4 end to end.
- After each milestone, run the tests and the dev server, take a screenshot, and check it against the acceptance list.
- If something in the docs is unclear or seems wrong for learning, say so and suggest a better option instead of guessing.
