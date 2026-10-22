/** Episode 1, model 1: the same task sent to a chatbot, a workflow, an agent and a multi-agent system. */

export type SystemType = "chatbot" | "workflow" | "agent" | "multi-agent";
export type TaskKind = "simple" | "process" | "open";
export type Quality = "good" | "ok" | "poor";

export const SYSTEM_TYPES: SystemType[] = ["chatbot", "workflow", "agent", "multi-agent"];

export type LaneResult = {
  type: SystemType;
  /** Node ids the task token visits, in order. Loops repeat ids. */
  path: string[];
  steps: number;
  seconds: number;
  tokens: number;
  quality: Quality;
  note: string;
};

/** The nodes each lane draws. The view lays them out; the path refers to them by id. */
export const LANE_NODES: Record<SystemType, { id: string; label: string }[]> = {
  chatbot: [
    { id: "in", label: "Question" },
    { id: "model", label: "Model" },
    { id: "out", label: "Answer" },
  ],
  workflow: [
    { id: "in", label: "Input" },
    { id: "s1", label: "Step 1" },
    { id: "s2", label: "Step 2" },
    { id: "s3", label: "Step 3" },
    { id: "out", label: "Output" },
  ],
  agent: [
    { id: "in", label: "Goal" },
    { id: "model", label: "Model decides" },
    { id: "search", label: "Search tool" },
    { id: "db", label: "Booking tool" },
    { id: "out", label: "Result" },
  ],
  "multi-agent": [
    { id: "in", label: "Goal" },
    { id: "lead", label: "Lead agent" },
    { id: "w1", label: "Worker A" },
    { id: "w2", label: "Worker B" },
    { id: "out", label: "Merged result" },
  ],
};

type Row = { path: string[]; seconds: number; tokens: number; quality: Quality; note: string };

const TABLE: Record<SystemType, Record<TaskKind, Row>> = {
  chatbot: {
    simple: { path: ["in", "model", "out"], seconds: 2, tokens: 600, quality: "good", note: "One call answers it. Nothing else is needed." },
    process: { path: ["in", "model", "out"], seconds: 2, tokens: 700, quality: "poor", note: "It can describe the steps but can't carry them out." },
    open: { path: ["in", "model", "out"], seconds: 3, tokens: 900, quality: "poor", note: "It answers from memory and can't look anything up." },
  },
  workflow: {
    simple: { path: ["in", "s1", "s2", "s3", "out"], seconds: 6, tokens: 1800, quality: "ok", note: "Correct, but three steps for a one-step job." },
    process: { path: ["in", "s1", "s2", "s3", "out"], seconds: 6, tokens: 1800, quality: "good", note: "Known steps, fixed order: predictable and cheap." },
    open: { path: ["in", "s1", "s2", "s3", "out"], seconds: 6, tokens: 1900, quality: "poor", note: "The fixed steps don't fit, and it can't change course." },
  },
  agent: {
    simple: { path: ["in", "model", "out"], seconds: 4, tokens: 1500, quality: "good", note: "It works, but deciding takes longer than just answering." },
    process: { path: ["in", "model", "db", "model", "search", "model", "db", "model", "out"], seconds: 14, tokens: 7200, quality: "good", note: "It gets there, but costs more and is less predictable than the workflow." },
    open: { path: ["in", "model", "search", "model", "search", "model", "db", "model", "search", "model", "out"], seconds: 22, tokens: 11800, quality: "good", note: "It chooses each next step from what it found. This is where agents earn their cost." },
  },
  "multi-agent": {
    simple: { path: ["in", "lead", "w1", "lead", "out"], seconds: 7, tokens: 4200, quality: "ok", note: "Coordination overhead for no benefit." },
    process: { path: ["in", "lead", "w1", "w2", "lead", "out"], seconds: 12, tokens: 16500, quality: "ok", note: "Handoffs between agents lose detail on linked steps." },
    open: { path: ["in", "lead", "w1", "w2", "w1", "w2", "lead", "out"], seconds: 15, tokens: 31000, quality: "good", note: "Workers research in parallel, so it's faster than one agent, at almost three times the tokens." },
  },
};

export function runTask(type: SystemType, task: TaskKind): LaneResult {
  const row = TABLE[type][task];
  return { type, ...row, steps: row.path.length - 2 };
}

const qualityRank: Record<Quality, number> = { good: 2, ok: 1, poor: 0 };

/** The best fit for a task: the cheapest system that still gives a good result. */
export function bestFit(task: TaskKind): SystemType {
  const results = SYSTEM_TYPES.map((t) => runTask(t, task));
  const top = Math.max(...results.map((r) => qualityRank[r.quality]));
  return results.filter((r) => qualityRank[r.quality] === top).sort((a, b) => a.tokens - b.tokens)[0].type;
}
