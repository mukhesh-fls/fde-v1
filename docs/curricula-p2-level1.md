# Programme 2 · Level 1: Foundations (source curriculum)

Extracted from Futurelab_AI_Curricula_Four_Programmes.docx (Programme 2, AI for Tech Professionals). This is the source for content/p2-l1/.

Level 1: Foundations
Outcome: learners can explain what an agent is, describe how an LLM behaves and why, and manage the context window as a core engineering concern.


## Episode 1 · What makes AI agentic

- From systems that answer questions to systems that take actions.
- The range of AI systems: a chatbot that answers, a fixed workflow that follows set steps, an agent that decides its own next step, and multiple agents working together
- The agent loop: assess the situation, decide on an action, act through a tool, check the result, and repeat until the goal is met or a limit is reached
- The defining difference: in an agent, the model chooses the next action. In a workflow, the developer does.
- Current examples: coding agents, research agents, customer support agents and operations agents
- Where agents fit: open-ended tasks with many possible paths, where the steps cannot be defined in advance
- Where a script or fixed workflow is the better choice: known steps, high cost of error, or strict requirements for speed and predictability
- Why agents are harder to build well: each loop adds time and cost, and errors in early steps carry into later ones
Systems lens: an agent is a loop, and every loop needs a limit, such as a step count, a budget or a person who can stop it.
Remember: agents choose their next step. Use an agent only when the task requires that choice. Every loop needs a limit.

## Episode 2 · Thinking in systems

- A system is parts, plus the connections between them.
- What a system is: parts, the connections between them, and a purpose
- An AI agent as a system: model, knowledge, tools, rules and people
- Most failures happen between parts, such as a slow tool combined with eager retries
- Stocks: quantities that build up or drain over time, such as the context window, the budget and user trust
- Feedback loops: a reinforcing loop amplifies change (a retry storm); a balancing loop holds a system steady (a budget cap)
- Delays: effects that appear well after their cause, such as stale data in an index or a cost increase seen only at month end
- How to draw a simple system map of an AI product
Systems lens: look at the connections, not just the parts.
Remember: look at connections, not just parts. Find the stocks and the loops. Give every reinforcing loop a brake.

## Episode 3 · Inside the LLM

- How a language model produces its output.
- What a language model does: it predicts the next token, one at a time, based on everything in its input
- Tokens: the units text is divided into. Cost, speed and limits are all measured in tokens.
- The context window: everything the model can see in a single call, with a fixed maximum size
- The model retains nothing between calls. Each call uses only the input it is given.
- Temperature and sampling: why the same input can produce different outputs, and when to reduce variation
- Reasoning models: they work through a problem before answering, which improves results on complex tasks at the cost of time and tokens
- Why hallucinations happen: the model always produces fluent output, so an incorrect answer can look as confident as a correct one
- How models are trained, in brief: pre-training on large text collections, followed by training to follow instructions
Systems lens: in any given call, the model's output depends on its training and on the context provided. Only the context is under your control.
Remember: the model predicts tokens. It retains nothing between calls. Fluent output is not necessarily correct.

## Episode 4 · The LLM as a component

- A brilliant, unpredictable component. Design around it.
- Treat the model as a component with a contract: clear inputs, a fixed output shape, a plan for failure
- Ask for structured output, and check every answer before using it
- Pin model versions and test every upgrade
- Send simple tasks to small models and hard ones to large models
- Time limits, one retry and a fallback as the brake
- Handling invalid output: retry once with the error, fall back to a simpler path, or route to a person
Systems lens: an unpredictable component can still be part of a reliable system if the surrounding components validate and contain its output.
Remember: a contract, structure you check, pinned versions.

## Episode 5 · Prompt design

- Prompts are part of the codebase: written, tested and versioned.
- The system prompt: the standing instructions that set the model's role, goal, rules and output format
- Be explicit and specific about what a good output looks like
- State the reason behind each rule. Models apply rules more accurately when the purpose is clear.
- Use examples to show the expected format and tone, and vary them to avoid over-copying
- Structure long prompts into clearly marked sections for instructions, reference material and examples
- Define what the model should do when information is missing: ask, state that it does not know, or stop
- Store prompts in version control, review changes, and test each change against a fixed set of questions
- Common mistakes: contradictory rules, adding a new rule for every failure, and emphasis in place of explanation
Systems lens: an unclear prompt produces errors that appear in later steps, where they are harder to trace.
Remember: be explicit and explain the reasons. Use examples. Test and version every prompt.

## Episode 6 · Context engineering

- Deciding what the model sees at each step.
- From prompt engineering to context engineering: managing everything the model receives at each step, not only the wording of instructions
- What fills the context window: system instructions, tool definitions, retrieved documents, conversation history and results of earlier actions
- The attention budget: as context grows, output quality can decline. More context is not better context.
- The objective: the smallest set of relevant information that makes the correct outcome likely
- Techniques: summarising earlier history, removing outdated tool results, and loading information only when it is needed
- Letting the agent retrieve information itself through search or file access, rather than supplying everything in advance
- Prompt caching: reusing the unchanged portion of the context across calls to reduce cost and latency
- Long tasks: storing notes and progress outside the context window so work can continue across sessions
Systems lens: the context window is a stock with a fixed limit. Manage what enters and what leaves it.
Remember: context is a limited budget. Keep only what is relevant. Load the rest on demand.

## Level 1 labs
- Episode 1: use the starter Kestrel support bot and record three errors it makes.
- Episode 2: draw a system map of Kestrel and identify one stock, one reinforcing loop and one missing limit.
- Episode 3: call the Claude API directly, count tokens, adjust temperature and compare outputs for the same input.
- Episode 4: make Kestrel return validated JSON for every response, with a fallback when validation fails.
- Episode 5: rewrite Kestrel's system prompt and measure the change on 20 test questions.
- Episode 6: reduce Kestrel's context by half without lowering its test score.
