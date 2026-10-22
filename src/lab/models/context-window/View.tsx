import { useEffect, useMemo } from "react";
import { create } from "zustand";
import type { Vec3 } from "../../../engine/labelAnchors";
import { useSceneLabels, type LabLabel } from "../../labels";
import { Box, lc, mixColor, Stage } from "../../primitives";
import { useLab } from "../../store";
import { Metric, Slider, Toggle } from "../../ui/controls";
import { buildContext, CONTEXT_DEFAULTS, type BlockKind, type ContextConfig } from "./logic";

type S = { cfg: ContextConfig; set: (p: Partial<ContextConfig>) => void };
export const useContextWindow = create<S>((set) => ({ cfg: CONTEXT_DEFAULTS, set: (p) => set((s) => ({ cfg: { ...s.cfg, ...p } })) }));

const LEN = 30; // world length of the full context window
const X0 = -LEN / 2;
const COLOR: Record<BlockKind, string> = { system: "#B9C3CF", tools: lc.lavender, retrieved: lc.sky, history: lc.mint, "tool-results": lc.butter, notes: lc.pink };
const STAGE: Record<BlockKind, string> = { system: "system", tools: "tools", retrieved: "retrieved", history: "history", "tool-results": "tool-results", notes: "history" };

export function ContextWindowView() {
  const cfg = useContextWindow((s) => s.cfg);
  const stage = useLab((s) => s.stageId);
  const setStagePoints = useLab((s) => s.setStagePoints);
  const r = useMemo(() => buildContext(cfg), [cfg]);
  const scale = LEN / r.capacity;

  const placed = useMemo(() => {
    let x = X0;
    return r.blocks.map((b) => {
      const len = Math.max(0.15, b.tokens * scale);
      const p = { b, x0: x, len };
      x += len;
      return p;
    });
  }, [r, scale]);

  useEffect(() => {
    const pts: Record<string, Vec3> = { "attention-budget": [LEN / 2 + 4, 0, 4], caching: [X0 + 3, 0, 4] };
    placed.forEach((p) => (pts[STAGE[p.b.kind]] ??= [p.x0 + p.len / 2, 0, 4]));
    setStagePoints(pts);
  }, [placed, setStagePoints]);

  const overflowX = X0 + LEN;
  const labels: LabLabel[] = placed.map((p) => ({
    id: p.b.kind,
    world: [p.x0 + p.len / 2, 3.1 + (p.b.kind === "tools" || p.b.kind === "history" ? 0.9 : 0), 0] as Vec3,
    text: p.b.label,
    sub: `${(p.b.tokens / 1000).toFixed(1)}k${p.b.cached ? " · cached" : ""}`,
    tone: stage === STAGE[p.b.kind] ? "accent" : "default",
    size: "sm",
  }));
  labels.push({ id: "limit", world: [overflowX, 4.6, 0], text: "Window limit", sub: `${r.capacity / 1000}k tokens`, tone: r.fill > 1 ? "bad" : "muted", size: "sm" });
  labels.push({
    id: "meter",
    world: [LEN / 2 + 4, 7.4, 0],
    text: `Answer quality ${Math.round(r.quality * 100)}%`,
    sub: `${Math.round(r.relevantShare * 100)}% of the window is relevant`,
    tone: stage === "attention-budget" ? "accent" : r.quality > 0.85 ? "good" : r.quality > 0.65 ? "warn" : "bad",
  });
  useSceneLabels("context-window", labels, `${JSON.stringify(cfg)}:${stage}`);

  const qColor = r.quality > 0.85 ? lc.good : r.quality > 0.65 ? lc.warn : lc.bad;
  return (
    <group>
      <Stage size={[46, 16]} />
      {/* The window: a long glass box with a token scale */}
      <Box position={[0, 1.3, 0]} size={[LEN, 2.6, 3]} color="#9FB7DA" opacity={0.12} explain="window" />
      <Box position={[overflowX, 1.3, 0]} size={[0.16, 3.2, 3.4]} radius={0.05} color={r.fill > 1 ? lc.bad : lc.ink} explain="limit" />
      {[0.25, 0.5, 0.75].map((f) => (
        <Box key={f} position={[X0 + LEN * f, 0.03, 1.7]} size={[0.06, 0.05, 0.4]} color={lc.edge} />
      ))}
      {placed.map((p) => {
        const inside = Math.max(0, Math.min(p.len, overflowX - p.x0));
        const outside = p.len - inside;
        const c = COLOR[p.b.kind];
        return (
          <group key={p.b.kind}>
            {inside > 0 && (
              <Box position={[p.x0 + inside / 2, 1.1, 0]} size={[inside - 0.05, 2.2, 2.6]} color={stage === STAGE[p.b.kind] ? mixColor(c, "#FFFFFF", 0) : mixColor(c, "#FFFFFF", 0.15)} explain={p.b.kind} />
            )}
            {outside > 0 && <Box position={[p.x0 + inside + outside / 2, 1.1, 0]} size={[outside - 0.05, 2.2, 2.6]} color={lc.bad} opacity={0.35} explain="overflow" />}
            {/* Cached prefix: a glowing outline */}
            {p.b.cached && <Box position={[p.x0 + p.len / 2, 2.4, 0]} size={[p.len, 0.1, 2.8]} radius={0.04} color={lc.mint} emissive={lc.mint} emissiveIntensity={1.6} explain="cached" />}
          </group>
        );
      })}
      {/* Quality meter */}
      <Box position={[LEN / 2 + 4, 3, 0]} size={[1.2, 6, 1.2]} color="#9FB7DA" opacity={0.14} explain="meter" />
      <Box position={[LEN / 2 + 4, (6 * r.quality) / 2, 0]} size={[1, 6 * r.quality, 1]} color={qColor} />
    </group>
  );
}

export function ContextWindowControls() {
  const { cfg, set } = useContextWindow();
  const r = useMemo(() => buildContext(cfg), [cfg]);
  return (
    <div className="lc">
      <Slider id="cw-turns" label="Conversation turns" value={cfg.turns} min={1} max={40} step={1} onChange={(v) => set({ turns: v })} />
      <div className="lc__toggles">
        <Toggle id="cw-sum" label="Summarise old history" checked={cfg.summarise} onChange={(v) => set({ summarise: v })} />
        <Toggle id="cw-drop" label="Drop old tool results" checked={cfg.dropToolResults} onChange={(v) => set({ dropToolResults: v })} />
        <Toggle id="cw-demand" label="Load documents on demand" checked={cfg.onDemand} onChange={(v) => set({ onDemand: v })} />
        <Toggle id="cw-cache" label="Prompt caching" checked={cfg.caching} onChange={(v) => set({ caching: v })} />
        <Toggle id="cw-notes" label="Notes outside the context" checked={cfg.notes} onChange={(v) => set({ notes: v })} />
      </div>
      <div className="lc__metrics">
        <Metric label="Tokens used" value={`${(r.total / 1000).toFixed(1)}k`} tone={r.fill > 1 ? "bad" : r.fill > 0.6 ? "warn" : "good"} />
        <Metric label="Window full" value={`${Math.round(r.fill * 100)}%`} tone={r.fill > 1 ? "bad" : undefined} />
        <Metric label="Cost per call" value={`$${r.costPerCall.toFixed(3)}`} />
        <Metric label="Cached share" value={`${Math.round(r.cachedShare * 100)}%`} />
        <Metric label="Answer quality" value={`${Math.round(r.quality * 100)}%`} tone={r.quality > 0.85 ? "good" : r.quality > 0.65 ? "warn" : "bad"} />
      </div>
      <p className="step__lead" style={{ fontSize: 12 }}>
        Example prices: $3 per million input tokens, cached tokens at a tenth of that. The quality curve is a teaching approximation.
      </p>
    </div>
  );
}
