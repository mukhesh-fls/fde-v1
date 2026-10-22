import { describe, expect, it } from "vitest";
import { buildContext, CONTEXT_DEFAULTS } from "./context-window/logic";
import { CONTRACT_DEFAULTS, runContract } from "./contract/logic";
import { searchBoth, searchKeywords, searchMeaning, words } from "./embedding-lookup/logic";
import { DEFAULT_ON, runTestSet, SECTIONS, type Section } from "./prompt-stack/logic";
import { ROUTING_DEFAULTS, runRouting } from "./routing/logic";

describe("contract", () => {
  it("without validation, bad output reaches users", () => {
    expect(runContract(CONTRACT_DEFAULTS).counts["bad-to-user"]).toBeGreaterThan(0);
  });

  it("validate + retry + fallback means no bad output reaches users, and the retry rescues most failures", () => {
    const r = runContract({ ...CONTRACT_DEFAULTS, validate: true, retry: true, fallback: true });
    expect(r.counts["bad-to-user"]).toBe(0);
    expect(r.counts["valid-after-retry"]).toBeGreaterThan(r.counts.fallback);
  });

  it("validation without a fallback sends failures to a person, which costs the most", () => {
    const people = runContract({ ...CONTRACT_DEFAULTS, validate: true });
    const fallback = runContract({ ...CONTRACT_DEFAULTS, validate: true, fallback: true });
    expect(people.counts.person).toBeGreaterThan(0);
    expect(people.cost).toBeGreaterThan(fallback.cost);
  });
});

describe("routing", () => {
  it("routing by difficulty costs far less than sending everything to the large model, for similar accuracy", () => {
    const large = runRouting({ ...ROUTING_DEFAULTS, mode: "all-large" });
    const routed = runRouting(ROUTING_DEFAULTS);
    expect(routed.cost).toBeLessThan(large.cost * 0.5);
    expect(routed.accuracy).toBeGreaterThan(large.accuracy - 0.08);
  });

  it("sending everything to the small model is cheapest but least accurate", () => {
    const small = runRouting({ ...ROUTING_DEFAULTS, mode: "all-small" });
    const routed = runRouting(ROUTING_DEFAULTS);
    expect(small.cost).toBeLessThan(routed.cost);
    expect(small.accuracy).toBeLessThan(routed.accuracy);
  });
});

describe("prompt stack", () => {
  const all = new Set(SECTIONS.filter((s) => !s.bad).map((s) => s.id));

  it("every good section together passes the whole test set", () => {
    expect(runTestSet(all).score).toBe(12);
  });

  it("the starting prompt passes only a few", () => {
    expect(runTestSet(new Set(DEFAULT_ON)).score).toBeLessThan(6);
  });

  it("a contradictory rule breaks tests that used to pass", () => {
    const withBad = new Set<Section>([...all, "contradiction"]);
    expect(runTestSet(withBad).score).toBeLessThan(12);
  });
});

describe("context window", () => {
  it("a long conversation with everything kept passes the window limit", () => {
    expect(buildContext({ ...CONTEXT_DEFAULTS, turns: 40 }).fill).toBeGreaterThan(1);
  });

  it("summarising, dropping old tool results and loading on demand keep it small and raise quality", () => {
    const raw = buildContext({ ...CONTEXT_DEFAULTS, turns: 40 });
    const lean = buildContext({ ...CONTEXT_DEFAULTS, turns: 40, summarise: true, dropToolResults: true, onDemand: true });
    expect(lean.total).toBeLessThan(raw.total / 4);
    expect(lean.quality).toBeGreaterThan(raw.quality + 0.2);
  });

  it("caching lowers the cost without changing what the model sees", () => {
    const a = buildContext(CONTEXT_DEFAULTS);
    const b = buildContext({ ...CONTEXT_DEFAULTS, caching: true });
    expect(b.total).toBe(a.total);
    expect(b.costPerCall).toBeLessThan(a.costPerCall);
  });
});

describe("embedding lookup", () => {
  it('"I want my money back" finds a refund chunk by meaning', () => {
    expect(searchMeaning("I want my money back", 3)[0].chunk.topic).toBe("refunds");
  });

  it("keyword search needs shared words, so the best match by meaning shares no words with the query", () => {
    const top = searchMeaning("I want my money back", 1)[0].chunk;
    const shared = words(top.text).filter((w) => ["want", "money", "back"].includes(w));
    expect(shared).toHaveLength(0);
  });

  it("an exact code is found by keywords, and Both keeps it near the top", () => {
    expect(searchKeywords("booking REF-2041", 1)[0].chunk.id).toBe("C5");
    expect(searchBoth("booking REF-2041", 3).map((h) => h.chunk.id)).toContain("C5");
  });

  it("each preset lands in the right topic", () => {
    expect(searchMeaning("my bag never arrived", 1)[0].chunk.topic).toBe("baggage");
    expect(searchMeaning("change my flight date", 1)[0].chunk.topic).toBe("changes");
    expect(searchMeaning("do I need a visa for Singapore", 1)[0].chunk.topic).toBe("documents");
  });
});
