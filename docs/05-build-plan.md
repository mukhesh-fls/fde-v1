# 05 · Build plan

> **Status (2026-10-20):** M0 and M1 are done. M2 and M3 are done, plus the mentor chat from M6 (Haiku with an offline fallback), the module exam and the scoreboard, all pulled forward at the user's request (see `decisions.md` 11–17). Next is M4, the Rebooking Desk simulation, which adds the Watch and Fix steps to Station 4.

Build in this order. Finish each milestone, run tests and the dev server, take a screenshot, and check the acceptance list before moving on.

## M0 · Project setup
- Vite + React + TypeScript; add three, R3F, drei, zustand, vitest, CodeMirror.
- Folder structure from `04-engine.md`. Load `content/modules.json`.

**Accept:**
- `npm run dev` shows a blank light page.
- `npm test` runs.

## M1 · Airport overview
- Ground, airport road loop, runway, and 17 building blocks placed per `02-airport-map.md`, using simple low-poly shapes.
- Terminal 1 in white and blue glass; locked buildings paler with a lock chip.
- Orbit and zoom with limits; hover labels; departures board panel (AI01 Boarding, others Scheduled).
- Small ambient life: one plane taxiing and a few passengers walking to Terminal 1.

**Accept:**
- It looks like a calm, professional airport model in light theme.
- Every building shows its module on hover.
- 60 fps.

## M2 · Into Terminal 1
- Click Terminal 1: the camera flies in, the roof and front wall fade, and the interior appears.
- Eight station areas laid out as in `03-module-01.md`, each with simple props and a floor label.
- The avatar walks to a clicked station. Esc returns to the overview.
- Model City Airport sits outside, linked by a taxiway.

**Accept:**
- Going in and out feels smooth.
- Each station is identifiable at a glance.
- Locked stations are visibly inactive.

## M3 · Station panel and step engine
- The station panel with all step types (Brief, Predict, Watch, Video, Fix, Code, Check, Certified), driven by `content/m01/lessons.json`.
- Mentor bubble with scripted lines. Progress saved locally.

**Accept:**
- You can click through every step of any station using placeholder content.
- Progress survives a reload.

## M4 · Vertical slice: Station 4, Rebooking Desk
- `stations/m01-s04-rebooking/sim.ts`, using the simulation rules in `03-module-01.md`, plus tests proving the three outcomes.
- 3D view:
  - planes taxi between gates and Model City;
  - the queue grows in the terminal;
  - the Model City apron fills;
  - the tower light turns red on 429s;
  - passengers turn red when they give up.
- Fix-step controls with a live target and load chart, and mentor hints driven by `conditions`.
- Part 2: the double-refund ledger with the idempotency toggle.

**Accept:**
- A new viewer understands within 30 seconds why gates get stuck and why instant retries make it worse, just by watching.
- Tests pass.

## M5 · Code step
- The Pyodide worker, CodeMirror editor, and hidden tests for Station 4.
- Passing upgrades the station in 3D.

**Accept:**
- The starter code fails and shows clear messages.
- A correct solution passes within 5 s and the station visibly upgrades.

## M6 · Mentor via the Claude API
- `server/mentor.ts`, the per-station system prompt, the "Ask Ravi" box, and the scripted fallback.

**Accept:**
- Ravi gives hints without full answers and replies in under 60 words.
- It works offline using the fallback.

## Spike · FastAPI + SSE in Pyodide (before M7)
- Check that FastAPI, Pydantic and an SSE `StreamingResponse` run in Pyodide, and can be driven by an in-process test client with simulated disconnects.
- Report the result before building Stations 2, 3 and 8. If it doesn't work, pick a fallback (for example, a minimal ASGI harness without FastAPI).

## M7 · The other seven stations of Module 01
- Build Stations 1, 2, 3, 5, 6, 7 and 8 using the same pattern: a sim with tests, the view, controls and content.

**Accept:**
- Each station's break and fix are visible in 3D and covered by tests.

## M8 · Retention features
- Passport and boarding pass, the streak, review questions (days 1/3/7/21), and the daily disruption on a certified station.

**Accept:**
- A returning learner sees what's due today within one screen.

## M9 · Phone mode and embedding
- 2D map mode on small screens; reduced-motion support.
- Embed into the Next.js site at `/ai-school/airport`.

## After Module 01
- Pilot with about 40 learners, comparing this format with the usual video and quiz.
- Track:
  - return after 7 and 30 days;
  - stations finished per week;
  - scores on a practical task.
- Then build Module 02 (Flight Training Centre) using only new content and new sims.
