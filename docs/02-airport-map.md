# 02 · Airport map

The programme has 17 modules across four levels. Each module is one airport building. Buildings unlock in order along the airport road, and the departures board lists them as flights.

## Layout

```
                      [11 Runway Operations]=========================== RUNWAY
                                   |
 [02 Flight Training]  [03 Engine Hangar]  [13 Pilot Academy]  [09 Safety Office]
          |                    |                  |                    |
 =====================  AIRPORT ROAD (loop)  ===================================
          |                    |                  |                    |
 [01 TERMINAL 1] -- [04 Airline Desks] -- [05 Flight Planning] -- [10 Lounge & Signage]
          |                    |                  |                    |
 [06 Baggage Hall]   [07 Cargo Terminal]   [08 Ground Ops]   [14 Info & Announcements]
          |
 [15 Security & Customs]   [12 Partner Airport Site]   [16 Field Office]   [17 Authority Boardroom]
                                                       |
                                      [CTRL TOWER: observability view across all buildings]
```

Treat this as a guide, not an exact plan. Keep Level 1 buildings closest to the entrance road, Level 2 around the central terminal area, Level 3 near the runway, and the FDE buildings in a separate "partner airport" district.

## Modules → buildings → what the metaphor teaches

| # | Module | Building | The airport mapping |
|---|---|---|---|
| 01 | Software foundations for AI systems | **Terminal 1** | Passengers = requests, counters = endpoints, staff = workers, flights = model calls, rebooking = retries, records office = database, control tower = logs. Full detail in `03-module-01.md`. |
| 02 | Machine learning and deep learning essentials | **Flight Training Centre** | A simulator where a trainee pilot (the model) practises landings. Landing error = loss; each practice round = a training step; the instructor's correction = gradient. Overfitting = a pilot who only lands well on one runway. |
| 03 | How LLMs work | **Engine Hangar** | A jet engine opened up: the stages are tokenizer → embeddings → attention layers → output. Walk a sentence through the engine stage by stage; attention shows as which parts of the sentence each word "looks at". |
| 04 | Working with model APIs | **Airline Desks** | Several airlines fly to Model City (several model providers). Pricing, speed, limits, streaming and fallback routing when one airline cancels. |
| 05 | Prompt and context engineering | **Flight Planning Office** | The prompt is the flight plan. The context window is the aircraft's weight limit: load the right cargo (context), not everything. Structured outputs = standard forms. |
| 06 | Embeddings, search and RAG | **Baggage Hall & Lost and Found** | Find the right bag among thousands from a passenger's description. Bags are shelved by "what they're like" (embeddings), with chunking, retrieval and reranking. Wrong bag returned = a hallucination. |
| 07 | Data engineering and enterprise integration | **Cargo Terminal** | Freight arrives from many shippers in different formats and paperwork. Cleaning, mapping, connectors, permissions and pipelines. Bad records fall off the belt. |
| 08 | Agents, tools and MCP | **Ground Operations** | Ground crew robots with tools: tugs, fuel trucks, loaders. An agent plans, picks tools and acts. MCP = the standard plug every vehicle uses. Failure modes: loops, wrong tool, unsafe actions. |
| 09 | Evals and testing for AI | **Safety & Certification Office** | Test flights with checklists and scores before a new aircraft (model or prompt) enters service. Regression = a new aircraft that's worse on routes the old one handled. |
| 10 | AI product design and UX | **Lounge & Signage** | Wayfinding, trust and feedback. Passengers abandon unclear signs; good design shows status, confidence and a way to get human help. |
| 11 | Inference, serving and LLMOps | **Runway Operations** | Runways are GPUs. Batching = landing planes in tight sequence. Caching, routing, autoscaling, latency vs cost. Release management = moving flights onto a new runway safely. |
| 12 | Cloud, infrastructure and client-environment deployment | **Partner Airport Site** | Building inside someone else's airport: their network, security rules, approvals and data residency. Terraform = construction plans. |
| 13 | Fine-tuning and post-training | **Pilot Academy** | Retrain a pilot for one specific route: when it's worth it vs better flight plans (prompts) or better maps (RAG). Datasets, LoRA, evaluation. |
| 14 | Multimodal, speech and Indian languages | **Information Desk & Announcements** | Announcements in Hindi, Tamil and mixed language; reading signs (vision); voice desk (speech in/out); latency for live conversation. |
| 15 | Security, safety and governance | **Security Checkpoint & Customs** | Smuggled instructions hidden in luggage = prompt injection. Data leaks, least-privilege tool access, audit trails and the OWASP LLM Top 10 as the checkpoint rulebook. |
| 16 | The forward deployment craft | **Field Office** | Working on site with a client airport team: discovery, finding the workflow worth automating, proving value with numbers, handover. |
| 17 | Client leadership and commercial skills | **Authority Boardroom** | Scoping, pricing, stakeholder meetings and difficult conversations, played as branching scenarios. |
| — | Capstone | **Open Your Own Airport** | The learner designs and ships a real AI product. Their airport becomes their portfolio. |

## Format per module

Every module uses the same station steps (see `01-concept.md`). The kind of "Fix it" mechanic changes with the subject:

- **Flow modules** (01, 04, 06, 07, 11): live 3D flow of passengers, bags or planes, tuned with controls.
- **Inside-the-machine modules** (02, 03, 13): step through a process stage by stage and inspect each stage.
- **Attack and defence modules** (08, 15): waves of tricky inputs or attacks against the learner's setup.
- **Scenario modules** (09, 10, 12, 16, 17): branching situations with characters, decisions and consequences.
