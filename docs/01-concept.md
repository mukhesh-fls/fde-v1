# 01 · Concept

## The problem

Most AI courses are videos plus quizzes. Learners pay, watch a few videos, get bored, and stop. Engineers also forget concepts they've only watched and never seen fail.

## The idea

The course is a working airport, and the learner runs it.

An airport is a near-perfect picture of a production software system:

| In the airport | In the software |
|---|---|
| Passengers arriving | Incoming requests |
| Check-in counters | API endpoints |
| Document check | Request validation |
| Ground staff | Workers handling requests |
| Flights to Model City | Calls to the LLM provider |
| Flight delays and cancellations | Provider latency and errors |
| Air traffic control slots | Rate limits |
| Rebooking desk | Retry logic |
| Boarding pass number | Idempotency key |
| Baggage belts | Queues and background jobs |
| Cargo containers | Docker containers |
| Maintenance hangar inspections | Code review, CI and tests |
| Passenger records office | The database |
| Control tower and radar | Logs, metrics and traces |

Because the mapping is real, the learner sees cause and effect. Remove the timeout, and passengers pile up at the gate. Retry instantly, and the gates jam. They don't have to imagine it.

## Structure

- **The programme is one airport.** The opening view is an aerial shot of the whole airport, with a departures board showing each module as a flight (AI01 Boarding, AI02 Scheduled, and so on).
- **Each module is a building.** Click it and the camera flies in; the roof lifts away to show the inside.
- **Each lesson is a station inside the building.** The learner's avatar walks to it and the station panel opens.
- **Each finished station stays running.** It keeps handling passengers, and later disruptions hit stations the learner built.

## How a station teaches

Every lesson follows the same eight steps, so learners always know where they are.

| Step | What happens | Time |
|---|---|---|
| 1. Brief | The mentor gives the situation in two or three lines. | 30 s |
| 2. Predict | One question before anything runs: "What will happen?" | 1 min |
| 3. Watch it break | The station runs in 3D with today's problem. Metrics turn red. | 2 min |
| 4. Video | The existing 3–4 minute AI video explains what they just saw. It plays on a screen at the station. | 4 min |
| 5. Fix it | Live controls (sliders, toggles, choices) change the station's behaviour. The learner must hit a target shown on screen. | 4 min |
| 6. Code it | They write the same fix in real Python. Hidden tests run. When they pass, the station is upgraded with their code. | 5 min |
| 7. Check | Three questions; the mentor explains any wrong answer. | 2 min |
| 8. Certified | The station lights up. A passport stamp is awarded. Review questions are scheduled for days 1, 3, 7 and 21. | 30 s |

The existing videos, text and MCQs all keep their place. Steps 2, 3, 5 and 6 are what's new.

## Why it works for learning

- **Predict first:** guessing before seeing the result makes people pay attention to it.
- **See it fail:** a failure they watched happen sticks better than a definition.
- **Explanation after experience:** the video lands better because they have a question in mind.
- **Hands-on in two forms:** controls build intuition, and code builds the real skill.
- **Spaced review:** questions return over three weeks, so the concept stays.

## Why people come back

- **Departures board:** always shows what's boarding next.
- **Daily disruption:** each day one certified station has an incident, such as "the model provider is slow at Gate 4". Fixing it takes three minutes and keeps the on-time streak.
- **Passport:** a stamp for every station and a boarding pass for every module, to show progress and share.
- **Seasons after the course:** new disruptions and new stations when AI changes.

## Look and feel

- Light theme. White and light grey buildings, blue glass, soft daylight, gentle shadows.
- Low-poly but precise, like an architect's model. Small planes taxi, passengers move as simple figures, and bags travel on belts.
- UI panels in a clean airport-signage style: a departures board, station panels and status chips.
- The reference for tone is WareTrack (a 3D warehouse tool that went viral for looking like a strategy game): live, clickable, calm and professional.

## The user journey (first session)

1. **Aerial view of the airport.** The departures board shows AI01 Software Foundations · Boarding.
2. **Terminal 1.** Click it; the camera flies in and the roof lifts. Eight stations are visible: three ready, five greyed out.
3. **Ground Staff Desk.** The avatar walks to it and the station panel opens on step 1.
4. **The lesson.** About 15–20 minutes later the station is certified, a passport stamp appears, and the next station unlocks.
5. **Back outside.** The learner sees their station now running, with passengers flowing through it.
