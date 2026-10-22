# 03 · Module 01 in detail: Terminal 1

**Module:** Software foundations for AI systems
**Building:** Terminal 1
**Mentor:** Ravi, a senior engineer at the airport's operations team (calm, direct, never gives the full answer straight away)

Terminal 1 has eight stations. The learner walks between them in order.

```
 ENTRANCE (passengers arrive)
   │
   ├─ [2] Check-in & Document Check ──┐
   │                                   │
   ├─ [1] Ground Staff Desk            │
   │                                   ▼
   ├─ [3] Gate Announcements ──── GATES ═════► flights to MODEL CITY (provider, outside)
   │                                   ▲
   ├─ [4] Rebooking Desk ──────────────┘
   │
   ├─ [5] Cargo Container Bay      [6] Maintenance Hangar (side wing)
   │
   ├─ [7] Passenger Records Office
   │
   └─ [8] Control Tower Room (mezzanine, overlooks the whole terminal)
```

For each station below:
- **Scene:** what the 3D shows
- **Brief:** the mentor's opening lines
- **Predict:** the first question; ✔ marks the correct answer
- **Break:** the failure the learner watches
- **Video:** what the existing AI video covers
- **Fix:** the controls and the target to hit
- **Code:** the real task and hidden tests
- **Check:** three questions; ✔ marks the correct answer
- **Upgrade:** what changes in the station once it's certified

---

## Station 1 · Ground Staff Desk: async Python, type hints, Pydantic

**Scene:** Staff at a desk, each handling passengers who need a call to the airline (the model). With blocking calls, a staff member stands frozen until the airline answers and the queue grows. With async, one staff member starts many calls and serves whoever's answer arrives first.

**Brief:** "Each passenger needs one call to the airline, and each call takes about a second. We have 20 passengers and one staff member. Let's see how long they wait."

**Predict:** With one staff member making calls one at a time, how long until all 20 passengers are served?
- About 1 second
- ✔ About 20 seconds
- About 2 seconds

**Break:** Run with blocking calls. A timer shows 20 s; passengers turn red as they wait. Then a single blocking `time.sleep` inside async code freezes every staff member at once.

**Video:** Event loop, `async`/`await`, `asyncio.gather`, why one blocking call freezes everything, type hints, and Pydantic models for settings and responses.

**Fix:** Toggle blocking vs async; a slider for how many calls run at once (1–20); a switch for "blocking call inside async". Target: all 20 served in under 3 s with nothing frozen.

**Code:** Write `async def fetch_all(prompts) -> list[Reply]` using an async client and `asyncio.gather`, with a `Reply` Pydantic model.
**Tests:**
- 20 prompts finish in under 3 s against a fake client with a 1 s delay.
- Output items are valid `Reply` objects.
- No blocking sleep is used.

**Check:**
1. What does `await` do? ✔ It pauses this task and lets the event loop run others · It makes the call faster · It runs the call in a new thread
2. A slow `time.sleep(5)` inside an async handler will… ✔ block every request on that event loop · only slow that one request · be skipped automatically
3. Why use a Pydantic model for model replies? ✔ To validate the shape and types before using them · To make the call faster · To store replies in a database

**Upgrade:** The desk gets an extra screen showing live concurrent calls; staff handle many passengers smoothly.

---

## Station 2 · Check-in & Document Check: FastAPI and error contracts

**Scene:** Passengers arrive at check-in with documents (requests). Some documents are wrong: a missing field, the wrong type, or a 2 MB prompt. A good counter rejects them politely with a slip saying what's wrong. A bad counter breaks and closes.

**Brief:** "Thirty passengers are coming. Some have bad paperwork. Right now one bad document shuts the counter for everyone."

**Predict:** A request is missing a required field. What should the API return?
- ✔ A 422 with a message naming the missing field
- A 500 Internal Server Error
- A 200 with an empty answer

**Break:** The counter crashes (500) on a malformed request and the queue behind it stops. Passengers get no reason.

**Video:** FastAPI routes, request models, validation, status codes (400/401/403/404/422/429/500), consistent error bodies, limits on input size.

**Fix:** Rules panel: required fields, types, maximum prompt length, error format. Watch 30 passengers (10 bad) go through. Target: 0 crashes, and every rejection has a code and a clear message.

**Code:** A FastAPI endpoint `POST /chat` with a Pydantic request model, a size limit, and a custom handler returning `{error: {code, message}}`.
**Tests:**
- A fuzzer sends 30 malformed requests, and none returns 500.
- Each error body matches the contract.
- Valid requests return 200.

**Check:**
1. A client sends a valid request but has hit their quota. Best status? ✔ 429 · 500 · 404
2. Why keep one error format across all endpoints? ✔ Clients can handle errors the same way everywhere · It makes responses smaller · FastAPI requires it
3. Where should prompt length be limited? ✔ At the API boundary, before calling the model · Only in the model · Nowhere; the model handles it

**Upgrade:** The counter shows a clean "document check" scanner and rejection slips. The queue never stops.

---

## Station 3 · Gate Announcements: streaming with SSE and websockets

**Scene:** At the gate, passengers wait for information. With buffering, nothing is said until everything is ready. With streaming, the announcement starts at once and continues. Some passengers walk away mid-announcement, yet the crew keeps preparing for them (wasted cost).

**Brief:** "Passengers think the gate is broken when it's silent for eight seconds. Also, we keep paying for work after people leave."

**Predict:** The full answer takes 8 s to generate. With streaming, when does the user see the first words?
- After 8 s
- ✔ Within about a second
- After 4 s

**Break:** Side by side: the buffered gate (8 s of silence, passengers leave) vs the streamed gate. Then a passenger leaves and the crew keeps working, with a cost counter ticking.

**Video:** Server-sent events vs websockets, time to first token, streaming from the provider through your API, detecting disconnects and cancelling upstream work.

**Fix:** Toggles for buffered or streamed, and for cancel on disconnect. Target: first words in under 1 s, and no cost after a passenger leaves.

**Code:** A FastAPI SSE endpoint that streams tokens from a fake model and stops the upstream generator when the client disconnects.
**Tests:**
- The first event arrives in under 1 s.
- After a simulated disconnect, the fake model receives a cancel within 0.5 s.

**Check:**
1. Main benefit of streaming to the user? ✔ They see progress almost at once · The answer is more accurate · It uses fewer tokens
2. When to prefer websockets over SSE? ✔ When both sides need to send messages continuously, like voice · For any text answer · Never
3. If the user closes the tab mid-answer and you don't cancel… ✔ you keep paying for tokens nobody reads · the model stops automatically · the answer is saved for later

**Upgrade:** The gate gets a live announcement board; walk-aways no longer cost anything.

---

## Station 4 · Rebooking Desk: background jobs, retries, timeouts and idempotency

*This is the vertical-slice station. Build it first and make it excellent.*

**Scene:**
- **Main area:** the gates area of Terminal 1, connected by a taxiway to **Model City Airport**, a separate small airport outside representing the model provider.
- **Passengers:** they arrive at a steady rate and are assigned to one of 10 gates (workers).
- **Flights:** each flight to Model City is one model call. A plane taxis out, waits at Model City, and returns with the answer.
- **Rebooking Desk:** handles failed flights.
- **Model City's parking apron:** fills up with planes when the provider is slow. It's the clearest picture of overload.
- **Control tower light:** turns red when air traffic control (the rate limit) refuses new flights.

**Brief:** "Model City is having a slow night: for about ten seconds, many flights take 15 seconds instead of 1. Our gates wait for every plane, however long it takes. Passengers give up after 10 seconds."

**Predict:** Model City slows down for ten seconds. What happens at our gates?
- Nothing much; it recovers on its own
- ✔ All gates get stuck waiting, the queue grows, and passengers leave
- Only the passengers on slow flights are affected

**Break:**
- **Default run (no timeout):** all 10 gates hold planes stuck at Model City, the terminal queue grows, and passengers turn red and leave. Answered rate is well under 75% (the tuned value is recorded under the simulation rules).
- **Second run (instant retries, three per passenger):** the rebooking desk sends planes back immediately. The Model City apron overflows, the tower light goes red (429), and recovery is delayed. The mentor names it: a retry storm.

**Video:** Timeouts, retries, exponential backoff, jitter, retry budgets, background jobs with queues, idempotency keys.

**Fix:** Controls:
- Timeout: none, 2 s or 5 s
- Retries: 0–4
- Backoff: immediate, or exponential with jitter
- Idempotency key: on or off (part 2)

Target: at least 90% of passengers answered within 10 s, and the tower light never turns red. A live chart shows load on Model City over time against its capacity line.

**Part 2: the double refund.** A refund flight times out, but the refund actually went through. The rebooking desk retries and the customer is refunded twice; a ledger on screen shows ₹2,000 paid twice. Turning on the idempotency key (the boarding-pass number) makes Model City recognise the repeat and return the first result.

**Code:** `call_model(prompt, key)`, a function with a timeout, at most 3 retries, exponential backoff with full jitter, a retry only on retryable errors (timeouts, 429, 5xx), and the same idempotency key on every attempt.
**Tests:**
- Survives four simulated waves: 25% instant 500s; 30% hangs; 429 with Retry-After; a 4 s total outage.
- At most 4 calls per request on average.
- Never retries a 400.
- The same key is sent on every attempt.

**Check:**
1. Why add random jitter to backoff? ✔ So many clients don't retry at the same moment · To make each retry faster · To hide errors from logs
2. Which is safe to retry without an idempotency key? ✔ Fetching an order's status · Charging a card · Sending a refund
3. The provider returns 400 Bad Request. You should… ✔ not retry; fix the request · retry with backoff · retry immediately

**Upgrade:** The rebooking desk gets a "Retry policy v2" sign. Planes now leave in gentle, spread-out waves, and the tower light stays green during later disruptions.

### Simulation rules (for `sim/rebooking.ts`)

- Time step 0.1 s; the run lasts 30 s of arrivals plus a drain period. Seeded random numbers.
- Arrivals: 3 passengers per second. Gates (workers): 10. Patience: 10 s from arrival.
- Model City latency: normally 0.8 s ±20%. Between t = 6 s and t = 16 s, each new flight has a 40% chance of taking 15 s; the rest stay normal. (Only some calls are slow, as in real tail latency. That's why a timeout plus a retry helps: the retry usually lands on a fast flight. If every call were slow, no client-side fix could reach the target.)
- Capacity: more than 30 flights in the air at once means every extra flight gets a 429 within 0.3 s.
- Timeout: if set, a flight that takes longer returns as failed at the timeout, freeing the gate. **The plane stays at Model City** until its full latency has passed: the provider is still working on the abandoned request and it still counts against capacity. Timeouts free your workers, not the provider. With instant retries, abandoned planes pile up on the apron, pass 30, and the tower goes red (429). That's the retry storm.
- Retries:
  - Immediate: the passenger rejoins the queue at once.
  - Exponential: the passenger waits 0.5 × 2^(attempt−1) × random(0.5–1.5) s, and the gate is free while they wait.
- Metrics: answered within patience (%), peak flights in the air, number of 429s, total flights.
- Tests must show:
  - The defaults answer under 75%.
  - Instant retries with a timeout produce 429s.
  - A 2 s timeout, 3 retries and exponential backoff reaches at least 90% with zero 429s.

Tune the constants until these hold, then document the final values.

---

## Station 5 · Cargo Container Bay: Docker, config and secrets

**Scene:** Cargo containers built in layers. Changing one item at the bottom forces every layer above it to be repacked, which the rebuild timer shows. An X-ray scanner looks through the layers and finds an API key taped inside one.

**Brief:** "Every small change takes four minutes to rebuild. And security says something sensitive is inside our container."

**Predict:** You change one line of app code. With `COPY . .` before `pip install`, what rebuilds?
- Only the app code layer
- ✔ The install layer and everything after it
- Nothing; Docker is clever

**Break:** The rebuild timer shows 4 minutes for a one-line change. The scanner highlights a `.env` file with a live key in layer 3.

**Video:** Images and layers, layer caching, ordering a Dockerfile, slim base images, `.dockerignore`, config from environment variables, and secrets never baked into images.

**Fix:** Drag Dockerfile lines into a better order; toggle `.dockerignore`; move the key to an environment variable. Target: rebuild under 30 s and a clean scan.

**Code:** Write the Dockerfile and `settings.py` (Pydantic settings reading from the environment).
**Tests:**
- Layer order puts dependency install before source copy.
- No secret is found in any layer.
- The app starts with config from the environment.

**Check:**
1. Best place for an API key at runtime? ✔ An environment variable or secret manager · Inside the image · In the Git repo
2. Why copy `requirements.txt` before the source code? ✔ So the install layer is cached when only code changes · It makes the image smaller · Docker needs that order
3. Deleting a secret in a later layer… ✔ doesn't remove it; it's still in the earlier layer · removes it completely · encrypts it

**Upgrade:** The containers are neatly stacked with a green "scanned" seal; rebuilds are fast.

---

## Station 6 · Maintenance Hangar: Git, code review, CI and pytest

**Scene:** A plane (a code change) arrives for inspection before it can fly. The checklist is the test suite and CI pipeline. Today's plane was prepared by a coding agent and has three hidden problems.

**Brief:** "A coding agent made this change. It looks fine and the demo works. Review it before it flies."

**Predict:** The change passes the demo. Is that enough to ship?
- Yes, the demo passed
- ✔ No; it needs tests and review for cases the demo didn't cover
- Yes, if the agent says it tested it

**Break:** Ship without review and the plane fails in service: a missing null check, a retry on a non-idempotent call, and a test that passes 9 times out of 10 (flaky).

**Video:** Branches and pull requests, reviewing diffs, writing focused tests, fixtures, CI pipelines, blocking merges, and spotting and fixing flaky tests.

**Fix:** Review the diff and click the lines that are problems, adding a short comment. Turn on CI gates. Target: find all three issues, with the pipeline blocking the bad change.

**Code:** Write the pytest tests that catch the null case and the double call, and remove the flakiness (a fixed seed or a fake clock).
**Tests:**
- The learner's tests fail on the agent's version and pass on the fixed one.
- They run 20 times with no flakes.

**Check:**
1. A test passes 9 times in 10. Best response? ✔ Find the source of randomness or timing and remove it · Re-run until green · Delete the test
2. What should CI block on? ✔ Failing tests and checks · Code style opinions only · Nothing; it's informational
3. Reviewing agent-written code, focus first on… ✔ behaviour in edge cases and side effects · variable names · comment style

**Upgrade:** The hangar shows a green CI light and an inspection stamp on approved planes.

---

## Station 7 · Passenger Records Office: Postgres and SQL essentials

**Scene:** A records office with a million passenger files on shelves. Without an index, a clerk walks every shelf to find one passenger; with an index, they check the catalogue and go straight there. A migration is shown as "renovating the office", which closes it to everyone at peak time.

**Brief:** "Support needs one customer's chat history. It takes 9 seconds. And tonight we need to add a column."

**Predict:** Finding one customer's chats in a million rows with no index means…
- ✔ The database reads most of the table
- It jumps straight to the rows
- It uses the cache automatically

**Break:** The query takes 9 s (the clerk walks every shelf). A migration that rewrites the table locks the office and queues every request.

**Video:** Tables and keys, `EXPLAIN ANALYZE`, indexes and when they help, `CREATE INDEX CONCURRENTLY`, safe migrations, connection pools.

**Fix:** Add an index on the right column(s) and see the query plan change from sequential scan to index scan. Choose a safe migration path. Target: query under 50 ms; no lock at peak.

**Code:** Write the index and the migration (plain SQL). It runs against a real Postgres in the browser (PGlite) seeded with the conversations table.
**Tests:**
- `EXPLAIN` shows an index scan.
- The migration uses the concurrent or online-safe pattern.
- Queries keep working during the migration test.

**Check:**
1. An index on `conversations(customer_id, created_at)` helps… ✔ fetching one customer's recent chats · every query on the table · inserts go faster
2. Adding a column with a default on a huge table at peak time… ✔ can lock or slow the table; plan it safely · is always instant · is impossible
3. What does `EXPLAIN ANALYZE` show? ✔ The plan the database used and how long each step took · The table schema · Index sizes only

**Upgrade:** The records office gets a catalogue cabinet; lookups are instant, and renovations happen at night with the office open.

---

## Station 8 · Control Tower Room: logging, structured errors and observability

**Scene:** The tower overlooks the whole terminal. Every passenger carries a flight number (request ID). Without IDs, radar shows dots you can't tell apart. With structured logs and trace IDs, you can follow one passenger from the entrance to Model City and back.

**Brief:** "A customer says her chat failed at 2:13 a.m. Find out why. You have five minutes."

**Predict:** Logs are plain text with no request IDs. How easy is it to find one customer's failed request among 50,000 lines?
- Easy, just search the time
- ✔ Very hard; many requests happened at the same moment
- Impossible

**Break:** A timed search through plain logs: dozens of lines at 02:13 that look alike. The clock runs out.

**Video:** Structured (JSON) logs, request and trace IDs, log levels, error context, basic metrics (rate, errors, duration), and following one trace end to end.

**Fix:** Turn on request IDs, JSON logs and tracing, then do the same search: filter by ID and follow the path through the terminal. Target: find the failing step within 2 minutes.

**Code:** FastAPI middleware that adds a request ID, logs JSON with it, and passes it on to the model call.
**Tests:**
- Every log line from one request has the same ID.
- Errors include context (status, step, duration).
- The ID appears in the outgoing call headers.

**Check:**
1. Why put a request ID on every log line? ✔ To follow one request across services · To make logs shorter · For security only
2. Which belongs in an error log? ✔ Request ID, step, status, duration · The user's full password · Nothing but "error"
3. "Rate, errors, duration" are… ✔ three core service metrics · log levels · test types

**Upgrade:** The tower screens show a live trace view. Daily disruptions start here: the learner clicks the alert and the camera flies to the affected station.

---

## Module 01 completion

- **Boarding pass:** "AI01 · Software foundations · Completed", showing stations certified and the date.
- **Capstone check:** a containerised FastAPI service that streams model output over SSE, with retries, timeouts and tests running in CI. Every station contributed one part.
- **Departures board:** AI02 Flight Training Centre changes to "Boarding".
