import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { create } from "zustand";
import type { Group, Mesh } from "three";
import type { Vec3 } from "../../../engine/labelAnchors";
import { useSceneLabels, type LabLabel } from "../../labels";
import { Box, elapsed, lc, Node, Stage } from "../../primitives";
import { useLab } from "../../store";
import { useTicker } from "../../useTicker";
import { Metric, Slider } from "../../ui/controls";
import { DEFAULT_BUDGET, PHASES, runLoop, type LoopConfig, type Phase } from "./logic";

type S = { cfg: Omit<LoopConfig, "budgetTokens">; startedAt: number | null; set: (p: Partial<LoopConfig>) => void; run: () => void };
export const useAgentLoop = create<S>((set) => ({
  cfg: { stepsNeeded: 6, failureRate: 0.2, stepLimit: null },
  startedAt: null,
  set: (p) => set((s) => ({ cfg: { ...s.cfg, ...p }, startedAt: null })),
  run: () => set({ startedAt: performance.now() }),
}));

const PHASE_SECONDS = 0.32;
const R = 7;
const ANGLE: Record<Phase, number> = { assess: -Math.PI / 2, decide: 0, act: Math.PI / 2, check: Math.PI };
const PHASE_LABEL: Record<Phase, string> = { assess: "Assess", decide: "Decide", act: "Act (tool)", check: "Check" };
const at = (a: number, r = R, y = 0): Vec3 => [Math.cos(a) * r, y, Math.sin(a) * r];

/** How far the playback has got: the index of the current event. */
export function playIndex(startedAt: number | null, length: number) {
  const e = elapsed(startedAt);
  if (e === null) return -1;
  return Math.min(length - 1, Math.floor(e / PHASE_SECONDS));
}

export function useLoopResult() {
  const cfg = useAgentLoop((s) => s.cfg);
  return useMemo(() => runLoop({ ...cfg, budgetTokens: DEFAULT_BUDGET }), [cfg]);
}

export function AgentLoopView() {
  const { startedAt } = useAgentLoop();
  const result = useLoopResult();
  const stage = useLab((s) => s.stageId);
  const setStagePoints = useLab((s) => s.setStagePoints);
  const token = useRef<Mesh>(null);
  const fill = useRef<Group>(null);
  const gate = useRef<Group>(null);
  useTicker(startedAt !== null);

  useEffect(() => {
    setStagePoints({ ...Object.fromEntries(PHASES.map((p) => [p, at(ANGLE[p], R + 3)])), limit: [0, 0, 3] as Vec3 });
  }, [setStagePoints]);

  const idx = playIndex(startedAt, result.events.length);
  const finished = startedAt !== null && elapsed(startedAt)! > result.events.length * PHASE_SECONDS;
  const ev = idx >= 0 ? result.events[idx] : null;

  useFrame(() => {
    const e = elapsed(useAgentLoop.getState().startedAt);
    if (token.current) {
      token.current.visible = e !== null && !finished;
      if (e !== null) {
        const i = Math.min(result.events.length - 1, Math.floor(e / PHASE_SECONDS));
        const f = (e % PHASE_SECONDS) / PHASE_SECONDS;
        const ph = result.events[i]?.phase ?? "assess";
        const a = ANGLE[ph] + f * (Math.PI / 2);
        token.current.position.set(...at(a, R, 1.2));
      }
    }
    const used = ev ? ev.tokens / DEFAULT_BUDGET : 0;
    if (fill.current) fill.current.scale.y = Math.max(0.001, finished ? result.tokens / DEFAULT_BUDGET : used);
    if (gate.current) gate.current.visible = finished && result.outcome === "limit";
  });

  const ringColor = finished ? (result.outcome === "done" ? lc.good : result.outcome === "limit" ? lc.warn : lc.bad) : lc.edge;
  const labels: LabLabel[] = PHASES.map((p) => ({
    id: p,
    world: at(ANGLE[p], R, 2.6),
    text: PHASE_LABEL[p],
    tone: stage === p || ev?.phase === p ? "accent" : "default",
    sub: p === "act" && ev?.phase === "act" ? (ev.ok ? "tool worked" : "tool failed") : undefined,
  }));
  labels.push({
    id: "centre",
    world: [0, 5.2, 0],
    text: finished ? (result.outcome === "done" ? "Goal met" : result.outcome === "limit" ? "Stopped by the step limit" : "Ran away: budget gone") : ev ? `Step ${ev.step}` : "Press Run",
    sub: `${((finished ? result.tokens : (ev?.tokens ?? 0)) / 1000).toFixed(1)}k of ${DEFAULT_BUDGET / 1000}k tokens`,
    tone: finished ? (result.outcome === "done" ? "good" : result.outcome === "limit" ? "warn" : "bad") : "plain",
    size: "lg",
  });
  useSceneLabels("agent-loop", labels, `${idx}:${finished}:${stage}`);

  return (
    <group>
      <Stage size={[30, 26]} />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.2, 0]}>
        <torusGeometry args={[R, 0.12, 10, 96]} />
        <meshPhysicalMaterial color={ringColor} clearcoat={0.8} roughness={0.3} emissive={ringColor} emissiveIntensity={finished ? 0.8 : 0} />
      </mesh>
      {PHASES.map((p) => (
        <Node
          key={p}
          position={at(ANGLE[p])}
          size={[3.2, 1.2, 2.2]}
          active={stage === p || ev?.phase === p}
          tint={p === "act" && ev?.phase === "act" && !ev.ok ? lc.bad : undefined}
          explain={p}
        />
      ))}
      <mesh ref={token}>
        <sphereGeometry args={[0.45, 24, 18]} />
        <meshStandardMaterial color={lc.accent} emissive={lc.accent} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      {/* Token budget: a column that fills as the loop spends tokens */}
      <group position={[0, 0, 0]}>
        <Box position={[0, 2, 0]} size={[1.6, 4, 1.6]} color="#9FB7DA" opacity={0.16} explain="budget" />
        <group ref={fill} position={[0, 0, 0]}>
          <Box position={[0, 2, 0]} size={[1.4, 4, 1.4]} color={ringColor === lc.edge ? lc.accentSoft : ringColor} />
        </group>
      </group>
      {/* The brake: a barrier across the loop when the step limit stops it */}
      <group ref={gate} position={at(ANGLE.assess - 0.35, R, 0)}>
        <Box position={[0, 1.5, 0]} size={[0.3, 3, 3.2]} color={lc.warn} explain="limit" />
      </group>
    </group>
  );
}

export function AgentLoopControls() {
  const { cfg, set, run, startedAt } = useAgentLoop();
  const result = useLoopResult();
  useTicker(startedAt !== null);
  const idx = playIndex(startedAt, result.events.length);
  const ev = idx >= 0 ? result.events[idx] : null;
  return (
    <div className="lc">
      <Slider id="al-steps" label="Steps the task needs" value={cfg.stepsNeeded} min={2} max={12} step={1} onChange={(v) => set({ stepsNeeded: v })} />
      <Slider id="al-fail" label="Tool failure rate" value={cfg.failureRate} min={0} max={0.6} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => set({ failureRate: v })} />
      <Slider
        id="al-limit"
        label="Step limit"
        value={cfg.stepLimit ?? 2}
        min={2}
        max={20}
        step={1}
        format={(v) => (v === 2 ? "Off" : String(v))}
        onChange={(v) => set({ stepLimit: v === 2 ? null : v })}
      />
      <button className="btn btn--primary" onClick={run}>
        Run
      </button>
      <div className="lc__metrics">
        <Metric label="Step" value={ev ? String(ev.step) : "–"} />
        <Metric label="Tokens" value={ev ? `${(ev.tokens / 1000).toFixed(1)}k` : "–"} />
        <Metric
          label="Outcome"
          value={startedAt === null ? "–" : result.outcome === "done" ? `Done in ${result.steps}` : result.outcome === "limit" ? "Stopped by limit" : "Ran away"}
          tone={startedAt === null ? undefined : result.outcome === "done" ? "good" : result.outcome === "limit" ? "warn" : "bad"}
        />
      </div>
    </div>
  );
}
