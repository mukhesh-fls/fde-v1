# Decisions

Every change to the original brief, and why. Newest at the bottom.

## 2026-10-20 · Review of the original brief

1. **Abandoned flights stay at Model City** (`03-module-01.md`, Station 4 simulation rules).
   With 10 gates and a capacity of 30, the original rules could never produce a 429. A timeout now frees the gate, but the plane stays at Model City until its full latency has passed. This also teaches the real lesson: timeouts free your workers, not the provider.

2. **Only 40% of flights are slow during the slowdown** (Station 4 simulation rules and brief).
   If every call took 15 s for 10 s, no client-side fix could reach 90% answered, so the Fix target would be impossible. With partial slowness (tail latency), a timeout plus a retry usually lands on a fast flight, which is why retries help in real systems.

3. **The default answered rate is tuned, not fixed at 65–70%** (Station 4 break).
   The original numbers gave about 50%. The tests only require "under 75%"; the tuned value will be recorded under the simulation rules.

4. **Station 7 uses PGlite** (`03-module-01.md`, `04-engine.md`).
   Pyodide can't run Postgres. PGlite is real Postgres compiled to WASM, so `EXPLAIN ANALYZE` shows genuine plans. It is single-connection, so "queries keep working during the migration" is checked in the sim.

5. **Spike on FastAPI + SSE in Pyodide before M7** (`05-build-plan.md`).
   Stations 2, 3 and 8 depend on it. We test it before building those stations.

6. **Ravi uses Claude Haiku (`claude-haiku-5-5`)** (`04-engine.md`).
   Replies are short (under 60 words) and must be fast; Haiku is the fastest and cheapest fit.

## 2026-10-20 · M0 and M1

7. **Building positions live in `content/airport-layout.json`**, not in `modules.json`.
   It keeps the module list readable and makes the layout data that tests check (no overlaps, nothing on the roads, Level 3 nearer the runway than Level 1, FDE buildings in the partner district). Terminal 1 sits on the west side with its own apron and taxiway link, since it's the one building planes fly from.

8. **The departures board shows five flights by default, with "Show all 17 flights".**
   The full board covered a third of the airport. Five rows still show what's boarding and what's next.

9. **Building labels are one DOM layer projected from 3D**, instead of drei `<Html>`.
   With React 19, 17 `<Html>` roots raced on mount and one label (AI01) was lost. One layer is also lighter.

10. **A control tower stands in the middle of the road loop.**
   It stands for observability across all buildings (from the airport map) and isn't clickable yet. Its light will turn red on 429s once the Rebooking Desk exists.

## 2026-10-20 · The learning loop (M2, M3 and part of M6, pulled forward)

The first review of M1 found that clicking Terminal 1 did nothing, so there was nowhere to learn. The user asked for the whole loop now: go inside, topics as objects, lessons with videos and quizzes, a module quiz that opens the next gate, a mentor character with a to-do bubble, a chat in the bottom right, and a scoreboard.

11. **The station step order for now is Brief → Predict → Learn → Quiz → Stamp.**
    Learn holds the video (when we have the file) plus written notes that teach the same ground, so the course works before the videos are added. Watch it break, Fix and Code steps get added per station as their simulations are built (M4 onwards). The content format already allows extra steps.

12. **Stations unlock one at a time, in order.** (The original brief showed three open at once.)
    The user wants each topic finished before the next "gate" opens. Each station quiz needs 2 of 3 to pass; a failed quiz shows the explanations and Ravi says why the first wrong answer was wrong.

13. **New: a module exam at the departure gate.** (Not in the original brief.)
    12 questions across all eight stations, 70% to pass. It unlocks when all stations are certified. Passing it raises the gate barrier, marks AI01 Completed and starts boarding AI02 on the departures board. Content is in `content/m01/exam.json`.

14. **The lesson notes, quizzes and exam were written from `03-module-01.md`** into `content/m01/lessons.json` and `content/m01/exam.json`. They should be reviewed by the course team. Video `src` values are `null` until the files are added.

15. **Ravi is in the 3D scene and in a chat box.**
    In the hall he walks beside the learner with a bubble showing the station's to-do list (ticked off as steps are done) or what to do next. "Ask Ravi" in the bottom right answers questions about the open station. It calls Claude Haiku (`claude-haiku-5-5`, low effort, under 60 words, with no quiz answers in its prompt) through `/api/mentor` when `ANTHROPIC_API_KEY` is set in `.env`. Without a key, it answers from the best-matching passage of the lesson notes and labels the answer as offline.

16. **A scoreboard is in the top bar**: XP, stations certified, quiz average, and per-station quiz scores, tries and exam result. Progress is saved in the browser (local storage) until accounts exist.

17. **Inside a building, a lesson list on the left mirrors the 3D stations**, so learners who don't want to navigate in 3D can still go straight to a topic.

## 2026-10-20 · AI Systems Lab: Programme 2, Level 1 in interactive 3D

The user shared the full curricula (`Futurelab_AI_Curricula_Four_Programmes.docx`) and asked for one module where every lesson is taught through interactive 3D models you can change and watch react, rather than video and text alone. They chose Programme 2 (AI for Tech Professionals), Level 1 Foundations (Episodes 1–6). A kids' "theme park" version (Programme 4) is the second priority and not started.

18. **The lab is a new building on the airport overview, the AI Systems Lab pavilion**, plus an "Open the AI Systems Lab" button in the top bar.
    Programme 2's structure (5 levels, 24 episodes) differs from the 17-module brief the airport was built on. Rather than re-map the airport, the lab sits beside it. Whether to re-map the airport to the new curriculum is an open question for the user. The source text is in `docs/curricula-p2-level1.md`.

19. **Each episode has one to three 3D models; there are 12 in total.** Each model has live controls, a "How it works" walkthrough (stage by stage, highlighted in 3D, with Ravi walking to the stage), and "Try this" experiments. Each episode also has a Read tab (the curriculum text) and a 3-question quiz.
    - Ep 1: four kinds of AI system side by side; the agent loop with a step limit.
    - Ep 2: a stock and flow (context window as a tank); a retry storm vs backoff and a retry budget.
    - Ep 3: next-token prediction (tokens, embeddings, attention, layers, probabilities, temperature, context window); an editable and trainable neural network; one API call end to end (401, 429, streaming, max_tokens).
    - Ep 4: an output contract (validate, retry once, fallback, person); routing between a small and a large model.
    - Ep 5: the system prompt as sections, scored against a 12-question test set.
    - Ep 6: what fills the context window and what each technique removes; search by meaning vs keywords on a 3D map of embeddings.

20. **The models are small, honest teaching versions, and say so on screen.** The language model is a trigram model trained on about 80 airline-support sentences, with a context-window topic boost. The embedding has 8 dimensions with a hand-written topic lexicon. The prompt scorer is rule-based. Prices are labelled as examples. Every model is a pure, seeded function with Vitest tests that prove its teaching point (`src/lab/models/*.test.ts`).

21. **The lab's content lives in `content/p2-l1/lessons.json`.** A test checks that every model and stage id in the content matches a view. The content was written from the curriculum and should be reviewed by the course team.

22. **Camera framings are solved, not hand-tuned.** Each model's extreme points are projected so the model fills about 92% of the gap between the episode list and the panel at 1440×900.

## 2026-10-20 · Lab visual overhaul, after the user's review

The user said the models reached about 40% of what they expected. They shared reference images (a glossy pastel neural network and a gradient-descent landscape) and asked for click-to-explain. They also reported that Ravi's moving card covered the model.

23. **The lab's 3D is the whole screen.** A frosted control dock sits at the bottom: the walkthrough stepper, the model's controls, and a caption that explains the current step. A slim top bar holds the breadcrumb, the episode picker and the model tabs. Learn and Quiz open in a side sheet that is closed by default, and the camera slides aside when it opens.

24. **Studio look:** pastel glossy materials (clearcoat), soft studio lighting built from light panels (nothing is downloaded, so it still works as an artifact), contact shadows, a light bloom on glowing parts, and S-curved cables.

25. **Click anything for a short explanation.** The texts are in `content/p2-l1/explain.json`. A test checks that every clickable id has text. Test cubes and embedding chunks show their own question or text.

26. **Ravi no longer walks in the scene.** His tips sit in a small docked card in the corner and can be hidden. The Ask Ravi chat is unchanged.

27. **New model in Episode 3: "How training finds weights"**, a two-weight error surface with gradient descent, a learning-rate slider (it overshoots when too large) and a local minimum. It sits after the neural network, since it shows how the weights get set.

## 2026-10-20 · Dark studio and a real transformer

28. **The lab uses a dark studio, an exception to "light theme only".** The user found the light lab washed out ("whitish everywhere"): they couldn't see what changed on each step, and asked for a dark background with bright elements. The lab now has a deep navy background, a reflective floor with a fading grid, smoked-glass objects, coloured rim lights and a stronger bloom so active parts glow. The airport overview and Terminal 1 stay light, as the brief says.

29. **"Inside the LLM" now shows the real transformer architecture**, in order: tokens; token embedding plus positional encoding; 4 transformer blocks, each with multi-head self-attention (4 heads with typical patterns, arcs per head), layer norm and a feed-forward layer, joined by the residual stream; then unembedding and softmax into next-token probabilities. Each Next token press plays a forward pass, a sheet of light rising through the tower, then drops the chosen token into the row. The model behind it is still the small trigram teaching model, and the screen says so. The head patterns and feed-forward activations are illustrative, not learned.

## 2026-10-21 · Premium pass and zoom

30. **Zoom:** scroll and pinch zoom towards the pointer (dolly to cursor), with quicker easing. The lab allows almost front-on views (polar angle up to 1.5), so the transformer tower isn't clamped. Zoom range in the lab is 6 to 140 units. On-screen + / − / Fit buttons sit on the right; Fit returns to the whole model.
31. **Premium look:** dark glass blocks with thin glowing edge lines and a light strip in the role colour; soft halos on glowing spheres; drifting light motes (Sparkles); ambient occlusion (N8AO) and SMAA anti-aliasing. The dock is kept compact (presets move to the Details tab; the caption is at most two lines), and Ravi's tip starts collapsed.
32. **Transformer layout:** more space between the attention and feed-forward rows, token text on the tiles, and the unembed and softmax output beside the top blocks so the whole model fits on one screen. **Embedding map:** points spread within each topic (display only; search uses the vectors) under a soft glow per region of meaning.
