/** Episode 3, model 3: one API call to a model provider, hop by hop. */

export type CallConfig = { streaming: boolean; validKey: boolean; rateLimited: boolean; maxTokens: number; promptTokens: number };
export type HopId = "app" | "internet" | "gateway" | "tokenizer" | "model" | "stream" | "response";
export type Hop = { id: HopId; label: string; ms: number; ok: boolean; detail: string };

export type CallResult = {
  hops: Hop[];
  status: 200 | 401 | 429;
  stopReason: "end_turn" | "max_tokens" | null;
  inputTokens: number;
  outputTokens: number;
  firstWordsMs: number | null;
  totalMs: number;
  costUsd: number;
  answer: string;
};

export const CALL_DEFAULTS: CallConfig = { streaming: true, validKey: true, rateLimited: false, maxTokens: 256, promptTokens: 400 };

/** Example prices for the lesson, not any real provider's price list: $ per million tokens. */
export const EXAMPLE_PRICE = { input: 1, output: 5 };

const FULL_ANSWER =
  "Your flight KT 204 to Delhi is delayed by two hours because of fog. The new departure time is 21:40. " +
  "You can change to the 23:15 flight at no cost in the app, or keep your seat. Delays over three hours get a meal voucher at the gate.";
const FULL_TOKENS = 64;
const MS_PER_OUTPUT_TOKEN = 22;

export function simulateCall(cfg: CallConfig): CallResult {
  const hops: Hop[] = [];
  const push = (h: Hop) => hops.push(h);
  push({ id: "app", label: "Your app", ms: 2, ok: true, detail: "Builds the request: model, system prompt, the whole conversation so far, max_tokens." });
  push({ id: "internet", label: "Internet (HTTPS)", ms: 40, ok: true, detail: "The JSON request travels encrypted to the provider." });

  const fail = (status: 401 | 429, detail: string): CallResult => {
    push({ id: "gateway", label: "API gateway", ms: 8, ok: false, detail });
    push({ id: "internet", label: "Internet (HTTPS)", ms: 40, ok: true, detail: "The error travels back." });
    return {
      hops,
      status,
      stopReason: null,
      inputTokens: 0,
      outputTokens: 0,
      firstWordsMs: null,
      totalMs: hops.reduce((s, h) => s + h.ms, 0),
      costUsd: 0,
      answer: "",
    };
  };
  if (!cfg.validKey) return fail(401, "401 Unauthorized: the API key is missing or wrong. Nothing reaches the model, and nothing is charged.");
  if (cfg.rateLimited)
    return fail(429, "429 Too Many Requests: this key has used its quota for now. The response says how long to wait (retry-after: 20).");

  push({ id: "gateway", label: "API gateway", ms: 8, ok: true, detail: "Checks the API key and the rate limit, then routes to a model server." });
  push({ id: "tokenizer", label: "Tokenizer", ms: 3 + Math.round(cfg.promptTokens / 400), ok: true, detail: `Splits your input into ${cfg.promptTokens} tokens.` });
  // Reading the prompt (prefill) is fast per token; writing the answer is one token at a time.
  const prefill = 80 + Math.round(cfg.promptTokens * 0.25);
  const outputTokens = Math.min(FULL_TOKENS, cfg.maxTokens);
  const generate = outputTokens * MS_PER_OUTPUT_TOKEN;
  const stopReason = cfg.maxTokens < FULL_TOKENS ? "max_tokens" : "end_turn";
  push({
    id: "model",
    label: "Model on GPUs",
    ms: prefill + generate,
    ok: true,
    detail: `Reads all ${cfg.promptTokens} input tokens at once (${prefill} ms), then predicts ${outputTokens} output tokens one at a time (${generate} ms).`,
  });
  push({
    id: "stream",
    label: cfg.streaming ? "Stream back" : "Wait, then send",
    ms: 40,
    ok: true,
    detail: cfg.streaming
      ? "Each token is sent back as soon as it is generated (server-sent events)."
      : "The whole answer is held until the last token, then sent in one response.",
  });
  push({ id: "response", label: "Your app shows it", ms: 2, ok: true, detail: `stop_reason: ${stopReason}. The model keeps nothing: the next call must send the history again.` });

  const totalMs = hops.reduce((s, h) => s + h.ms, 0);
  const upToModelStart = hops.slice(0, 4).reduce((s, h) => s + h.ms, 0) + prefill;
  const firstWordsMs = cfg.streaming ? upToModelStart + MS_PER_OUTPUT_TOKEN + 40 + 2 : totalMs;
  const words = FULL_ANSWER.split(" ");
  const answer = words.slice(0, Math.max(1, Math.round((words.length * outputTokens) / FULL_TOKENS))).join(" ");
  const costUsd = (cfg.promptTokens * EXAMPLE_PRICE.input + outputTokens * EXAMPLE_PRICE.output) / 1_000_000;
  return { hops, status: 200, stopReason, inputTokens: cfg.promptTokens, outputTokens, firstWordsMs, totalMs, costUsd, answer };
}

/** The request body the app sends, for the side panel. */
export function requestJson(cfg: CallConfig) {
  return JSON.stringify(
    {
      model: "example-model",
      max_tokens: cfg.maxTokens,
      stream: cfg.streaming,
      system: "You are Kestrel Travel's support assistant.",
      messages: [{ role: "user", content: "Is my flight to Delhi on time?" }],
    },
    null,
    2,
  );
}
