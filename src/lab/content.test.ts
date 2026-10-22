import { describe, expect, it } from "vitest";
import { labLessons } from "./content";

/** Model and stage ids the views implement. The content must use exactly these. */
const MODELS: Record<string, string[]> = {
  "system-types": ["chatbot", "workflow", "agent", "multi-agent"],
  "agent-loop": ["assess", "decide", "act", "check", "limit"],
  "stock-flow": ["stock", "inflow", "outflow", "limit"],
  "feedback-loops": ["request", "failure", "retry-storm", "brake"],
  "next-token": ["tokens", "embeddings", "attention", "layers", "probabilities", "sampling", "context-window"],
  "neural-net": ["inputs", "weights", "activations", "outputs", "training"],
  "loss-landscape": ["surface", "position", "slope", "step", "learning-rate", "local-minimum"],
  "api-call": ["app", "gateway", "tokenizer", "model", "stream", "response"],
  contract: ["request", "output", "validate", "retry", "fallback", "person"],
  routing: ["router", "small-model", "large-model", "trade-off"],
  "prompt-stack": ["role", "goal", "rules", "format", "examples", "missing-info", "test-set"],
  "context-window": ["system", "tools", "retrieved", "history", "tool-results", "attention-budget", "caching"],
  "embedding-lookup": ["chunks", "embed", "query", "nearest", "keywords", "into-context"],
};

describe("Level 1 lab content", () => {
  it("has six episodes in order", () => {
    expect(labLessons.map((l) => l.episode)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("every model in the content has a view with the same stages", () => {
    const used = labLessons.flatMap((l) => l.models);
    expect(used.map((m) => m.id).sort()).toEqual(Object.keys(MODELS).sort());
    for (const m of used) expect(m.stages.map((s) => s.id), m.id).toEqual(MODELS[m.id]);
  });

  it("every quiz question has a valid answer", () => {
    for (const l of labLessons) {
      expect(l.quiz.length).toBe(3);
      for (const q of l.quiz) expect(q.answer).toBeLessThan(q.options.length);
    }
  });
});
