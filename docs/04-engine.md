# 04 · Engine and technical design

## Stack

| Part | Choice | Why |
|---|---|---|
| App | Vite + React 19 + TypeScript | Fast iteration; later embedded in the Next.js website |
| 3D | `three`, `@react-three/fiber`, `@react-three/drei` | The same stack WareTrack used; declarative scenes, good helpers (`CameraControls`, `Html`, `Instances`, `Outlines`) |
| Effects | `@react-three/postprocessing` (light use) | Soft ambient occlusion and selection outlines only |
| State | `zustand` (with `persist`) | Simple global store for progress and UI |
| Animation | `maath` easing or drei helpers | Smooth camera fly-ins and avatar walking |
| Code steps | Pyodide in a Web Worker | Real Python in the browser; no servers running learner code |
| Code editor | CodeMirror 6 | Light theme, small bundle |
| Mentor | Claude API (Haiku, `claude-haiku-5-5`) via a small server route | Socratic hints; fast and cheap for short replies; the API key stays on the server |
| SQL steps | PGlite (Postgres compiled to WASM) | Real Postgres query plans (`EXPLAIN ANALYZE`) in the browser for Station 7. PGlite is single-connection, so "queries keep working during the migration" is checked by the sim, not by real concurrent sessions |
| Tests | Vitest (+ Playwright for a smoke test) | Pure simulations are unit-tested |

## Folder structure

```
src/
  app/                 App shell, routes (/, /m/:moduleId, /m/:moduleId/:lessonId)
  store/               zustand stores: progress, ui, settings
  content/             loaders and types for content/*.json
  world/
    Airport.tsx        aerial overview: ground, road, runway, buildings
    buildings/         one component per building exterior (Terminal1.tsx, ...)
    interiors/         one component per building interior (Terminal1Interior.tsx)
    props/             reusable low-poly props: Plane, Passenger, Gate, Desk, Belt, Container, Screen
  engine/
    CameraDirector.tsx fly-to, overview, building, station framings
    Avatar.tsx         the learner's figure; click-to-walk on a navigation path
    Selection.tsx      hover and click outlines, tooltips
    StationRuntime.tsx runs a lesson's steps and connects the simulation to the 3D view
  stations/
    m01-s01-ground-staff/   sim.ts, sim.test.ts, View.tsx, Controls.tsx
    m01-s04-rebooking/      sim.ts, sim.test.ts, View.tsx, Controls.tsx, Ledger.tsx
    ...
  ui/
    DeparturesBoard.tsx  module list as flights
    StationPanel.tsx     right-side panel showing the current step
    steps/               Brief, Predict, Watch, Video, Fix, Code, Check, Certified
    Mentor.tsx           mentor chat bubble and "ask Ravi" box
    Passport.tsx         stamps and boarding passes
    Hud.tsx              progress, streak, XP
  workers/
    pyodide.worker.ts    runs learner code and hidden tests with a time limit
server/
  mentor.ts            POST /api/mentor → Claude API
content/
  modules.json         all 17 modules (see file)
  m01/lessons.json     8 lessons with steps (from docs/03-module-01.md)
  m01/tests/           hidden Python tests per code step
```

## Content format

```ts
type ModuleDef = {
  id: string;              // "m01"
  code: string;            // "AI01" (shown on the departures board)
  title: string;
  level: "L1" | "L2" | "L3" | "FDE";
  building: { id: string; name: string; position: [number, number]; footprint: [number, number] };
  prerequisites: string[];
  lessons: LessonDef[];
};

type LessonDef = {
  id: string;              // "m01-s04"
  title: string;
  station: { name: string; position: [number, number, number]; standPoint: [number, number, number] };
  mechanic: string;        // key into the stations registry, e.g. "rebooking"
  steps: Step[];
  review: Question[];      // spaced-review pool
};

type Step =
  | { kind: "brief"; mentor: string[] }
  | { kind: "predict"; question: Question }
  | { kind: "watch"; config: Record<string, unknown>; mentorAfter: string[] }
  | { kind: "video"; src: string; durationSec: number; chapters?: { t: number; label: string }[] }
  | { kind: "fix"; controls: ControlDef[]; target: TargetDef; hints: Hint[] }
  | { kind: "code"; language: "python"; starter: string; testsRef: string; hints: string[] }
  | { kind: "check"; questions: Question[] }
  | { kind: "certified"; stamp: string; upgrade: string };

type Question = { prompt: string; options: string[]; answer: number; explain: string };
type ControlDef =
  | { id: string; kind: "select"; label: string; options: { value: string; label: string }[]; default: string }
  | { id: string; kind: "slider"; label: string; min: number; max: number; step: number; default: number }
  | { id: string; kind: "toggle"; label: string; default: boolean };
type TargetDef = { metrics: { id: string; label: string; op: ">=" | "<=" | "=="; value: number }[] };
type Hint = { when: string; text: string }; // `when` is a named condition the mechanic reports, e.g. "retry_storm"
```

## Station mechanic interface

Every station registers one mechanic:

```ts
interface Mechanic<Cfg, Snap, Metrics> {
  id: string;
  simulate(cfg: Cfg, seed: number): { frames: Snap[]; metrics: Metrics; conditions: string[] }; // pure
  View: React.FC<{ frame: Snap; t: number }>;   // draws the 3D at the station from a frame
  defaultCfg: Cfg;
}
```

- `simulate` is pure and deterministic, so it can be tested and replayed.
- `View` only renders the frames: no logic in 3D components.
- `conditions` let the mentor react ("retry_storm", "gates_stuck", "target_met").

## World and camera

- **Overview:** an angled aerial view of the whole airport. Drag to orbit, scroll to zoom, within limits. Buildings show a small label on hover; locked ones are paler with a lock chip.
- **Enter a building:** a 1.2 s camera fly-in. The roof and front wall fade out (cutaway) and the interior appears.
- **Station focus:** the camera frames the station, the panel opens on the right, and the rest of the building dims slightly.
- **Avatar:** click a station or the floor and the avatar walks along a simple waypoint path (no physics). Show the walk, but keep it under 2 s.
- Keyboard: Tab cycles stations; Enter opens one; Esc goes back up a level.

## Look

- **Palette:** background #F3F5F8; buildings #FFFFFF / #E6E9EE; glass #3F7FE0 at 35% opacity; accent #2F6FED; success #23884D; warning #E1A400; error #D9363E.
- **Lighting:** a soft hemisphere light plus one directional sun with soft shadows. No harsh contrast.
- **Fonts:** Inter for UI, JetBrains Mono for code and flight codes.
- **The departures board:** a real airport board, with module code, title, status (Boarding / Scheduled / Completed / Delayed: prerequisite) and gate (building).

## Mentor (Claude API)

- `POST /api/mentor` with `{ lessonId, step, learnerMessage, recentEvents, conditions }`.
- The system prompt is per station. Ravi gives hints, asks one question at a time, never pastes the full solution, and keeps replies under 60 words.
- Fallback: scripted hints from the content files when offline or rate-limited.
- Log nothing personal. Store the mentor transcript only if the learner opts in.

## Code steps (Pyodide)

- Load Pyodide lazily the first time a code step opens; show a loading bar.
- The worker runs the learner's code plus the hidden tests from `content/m01/tests/`, with a 5 s time limit (terminate the worker after that).
- Results show as a list of passed and failed tests with plain-language messages.
- Passing triggers the station upgrade.

## Progress and review

- Store per learner: certified stations, step position, answers, streak, review queue.
- The first version uses local storage via zustand `persist`. Later, Supabase tables (`progress`, `answers`, `reviews`).
- Review intervals are 1, 3, 7 and 21 days. A daily disruption picks a random certified station and replays its "break" with a twist.

## Performance and access

- Use instanced meshes for passengers, bags and planes. Pause the render loop when nothing moves (`frameloop="demand"` outside simulations).
- Target 60 fps on a mid-range laptop, and an initial download under 5 MB before the Pyodide lazy load.
- On phones, use a 2D map mode with the same stations and steps, and 3D only inside a station.
- `prefers-reduced-motion` turns fly-ins into fades.
- Every simulation also shows its numbers in the panel, so nothing is understood only by sight.

## Embedding in the website later

- Build the airport as a package or route. In Next.js, load it with `dynamic(() => import(...), { ssr: false })` at `/ai-school/airport`.
- Share auth and progress with the website when that exists.
