import { describe, expect, it } from "vitest";
import { CALL_DEFAULTS, simulateCall } from "./api-call/logic";
import { accuracy, EXAMPLES, forward, initialNet, loss, trainSteps } from "./neural-net/logic";
import { attention, detokenize, entropy, predict, sample, tokenize, train } from "./next-token/logic";

describe("next-token model", () => {
  const model = train();

  it("splits long words into pieces and joins them back", () => {
    const t = tokenize("Your bengaluru flight.");
    expect(t.length).toBeGreaterThan(4);
    expect(t.some((x) => x.piece)).toBe(true);
    expect(detokenize(t)).toBe("your bengaluru flight.");
  });

  it("predicts likely continuations from the training text", () => {
    const top = predict(model, tokenize("your flight to delhi is"), 1)[0];
    expect(top.token.text).toBe("delayed");
  });

  it("temperature 0 always picks the top candidate; higher temperature spreads the probability", () => {
    const ctx = tokenize("your bag");
    const cold = predict(model, ctx, 0);
    expect(cold[0].p).toBe(1);
    for (let s = 0; s < 20; s++) expect(sample(cold, s).key).toBe(cold[0].key);
    const warm = predict(model, ctx, 1);
    const hot = predict(model, ctx, 2);
    expect(entropy(hot.map((c) => c.p))).toBeGreaterThan(entropy(warm.map((c) => c.p)));
  });

  it("words inside the context window change the prediction; the same words outside it don't", () => {
    const withTopic = predict(model, tokenize("sorry , weather . the flight is"), 1);
    const without = predict(model, tokenize("the flight is"), 1);
    const p = (cs: typeof withTopic, k: string) => cs.find((c) => c.key === k)?.p ?? 0;
    expect(p(withTopic, "cancelled") + p(withTopic, "delayed")).not.toBeCloseTo(p(without, "cancelled") + p(without, "delayed"), 3);
  });

  it("attention weights for a token sum to 1 over itself and earlier tokens", () => {
    const t = tokenize("when will my refund arrive");
    const a = attention(t, 3);
    expect(a).toHaveLength(4);
    expect(a.reduce((x, y) => x + y, 0)).toBeCloseTo(1);
  });
});

describe("neural network", () => {
  it("outputs probabilities that sum to 1", () => {
    const f = forward(initialNet(), [1, 0, 0]);
    expect(f.probs[0] + f.probs[1]).toBeCloseTo(1);
  });

  it("changing one weight changes the output", () => {
    const a = initialNet();
    const b = initialNet();
    b.w2[0][0] = 3;
    expect(forward(b, [1, 0, 0]).probs[0]).not.toBeCloseTo(forward(a, [1, 0, 0]).probs[0], 2);
  });

  it("training lowers the loss and learns all the examples", () => {
    const before = loss(initialNet());
    const trained = trainSteps(initialNet(), 300);
    expect(loss(trained)).toBeLessThan(before / 3);
    expect(accuracy(trained, EXAMPLES)).toBe(1);
  });
});

describe("API call", () => {
  it("a wrong key stops at the gateway with 401 and costs nothing", () => {
    const r = simulateCall({ ...CALL_DEFAULTS, validKey: false });
    expect(r.status).toBe(401);
    expect(r.costUsd).toBe(0);
    expect(r.hops.some((h) => h.id === "model")).toBe(false);
  });

  it("over the rate limit returns 429", () => {
    expect(simulateCall({ ...CALL_DEFAULTS, rateLimited: true }).status).toBe(429);
  });

  it("streaming shows the first words much sooner, with the same total time", () => {
    const s = simulateCall({ ...CALL_DEFAULTS, streaming: true });
    const b = simulateCall({ ...CALL_DEFAULTS, streaming: false });
    expect(s.firstWordsMs!).toBeLessThan(b.firstWordsMs! / 3);
    expect(s.totalMs).toBe(b.totalMs);
  });

  it("a low max_tokens cuts the answer off with stop_reason max_tokens", () => {
    const r = simulateCall({ ...CALL_DEFAULTS, maxTokens: 16 });
    expect(r.stopReason).toBe("max_tokens");
    expect(r.outputTokens).toBe(16);
  });

  it("a longer prompt costs more and delays the first words", () => {
    const short = simulateCall({ ...CALL_DEFAULTS, promptTokens: 200 });
    const long = simulateCall({ ...CALL_DEFAULTS, promptTokens: 8000 });
    expect(long.costUsd).toBeGreaterThan(short.costUsd);
    expect(long.firstWordsMs!).toBeGreaterThan(short.firstWordsMs!);
  });
});

describe("transformer heads", () => {
  it("each head's weights sum to 1, and the previous-token head peaks on the token before", async () => {
    const { attentionHeads, tokenize } = await import("./next-token/logic");
    const t = tokenize("when will my refund arrive");
    const heads = attentionHeads(t, 4, 1);
    expect(heads).toHaveLength(4);
    for (const h of heads) expect(h.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    const prev = heads[1];
    expect(prev.indexOf(Math.max(...prev))).toBe(3);
  });
});
