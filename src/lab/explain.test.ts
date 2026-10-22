import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import raw from "../../content/p2-l1/explain.json";

const TEXT = raw as Record<string, Record<string, { title: string; body: string }>>;
const MODELS_DIR = join(__dirname, "models");

describe("click-to-explain text", () => {
  it("every explain id used by a model's view has text", () => {
    const missing: string[] = [];
    for (const model of readdirSync(MODELS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory())) {
      let src: string;
      try {
        src = readFileSync(join(MODELS_DIR, model.name, "View.tsx"), "utf8");
      } catch {
        continue;
      }
      for (const m of src.matchAll(/explain="([^"]+)"/g)) if (!TEXT[model.name]?.[m[1]]) missing.push(`${model.name}:${m[1]}`);
      // Dynamic ids: the views build these from known lists.
      if (model.name === "agent-loop") for (const p of ["assess", "decide", "act", "check"]) if (!TEXT[model.name]?.[p]) missing.push(`${model.name}:${p}`);
    }
    expect(missing).toEqual([]);
  });
});
