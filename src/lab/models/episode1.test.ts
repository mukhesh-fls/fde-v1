import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGET, runLoop } from "./agent-loop/logic";
import { bestFit, runTask } from "./system-types/logic";

describe("system types", () => {
  it("each task has a different best fit: chatbot, workflow, agent", () => {
    expect(bestFit("simple")).toBe("chatbot");
    expect(bestFit("process")).toBe("workflow");
    expect(bestFit("open")).toBe("agent");
  });

  it("multi-agent uses the most tokens on the open task", () => {
    const tokens = (["chatbot", "workflow", "agent", "multi-agent"] as const).map((t) => runTask(t, "open").tokens);
    expect(Math.max(...tokens)).toBe(runTask("multi-agent", "open").tokens);
  });

  it("only the agent and multi-agent lanes loop back to a decision", () => {
    const loops = (p: string[]) => new Set(p).size < p.length;
    expect(loops(runTask("workflow", "open").path)).toBe(false);
    expect(loops(runTask("agent", "open").path)).toBe(true);
  });
});

describe("agent loop", () => {
  it("finishes an easy task with reliable tools", () => {
    const r = runLoop({ stepsNeeded: 4, failureRate: 0, stepLimit: null, budgetTokens: DEFAULT_BUDGET });
    expect(r.outcome).toBe("done");
    expect(r.steps).toBe(4);
  });

  it("with flaky tools and no limit, the loop runs until the budget is gone", () => {
    const r = runLoop({ stepsNeeded: 12, failureRate: 0.6, stepLimit: null, budgetTokens: DEFAULT_BUDGET });
    expect(r.outcome).toBe("ran-away");
  });

  it("a step limit stops the same run early and spends far less", () => {
    const free = runLoop({ stepsNeeded: 12, failureRate: 0.6, stepLimit: null, budgetTokens: DEFAULT_BUDGET });
    const limited = runLoop({ stepsNeeded: 12, failureRate: 0.6, stepLimit: 8, budgetTokens: DEFAULT_BUDGET });
    expect(limited.outcome).toBe("limit");
    expect(limited.tokens).toBeLessThan(free.tokens / 2);
  });

  it("is deterministic for a seed", () => {
    const cfg = { stepsNeeded: 6, failureRate: 0.3, stepLimit: null, budgetTokens: DEFAULT_BUDGET };
    expect(runLoop(cfg, 3)).toEqual(runLoop(cfg, 3));
  });
});
