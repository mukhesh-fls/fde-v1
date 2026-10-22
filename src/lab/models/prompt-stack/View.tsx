import { useEffect } from "react";
import { create } from "zustand";
import type { Vec3 } from "../../../engine/labelAnchors";
import { useSceneLabels, type LabLabel } from "../../labels";
import { useExplain, useModelId } from "../../explain";
import { Box, lc, Stage } from "../../primitives";
import { useLab } from "../../store";
import { Metric, Toggle } from "../../ui/controls";
import { useTicker } from "../../useTicker";
import { DEFAULT_ON, runTestSet, SECTIONS, TEST_SET, type Section, type TestResult } from "./logic";

type Run = { version: number; score: number; results: TestResult[]; at: number };
type S = { on: Section[]; runs: Run[]; toggle: (s: Section) => void; run: () => void };

export const usePromptStack = create<S>((set, get) => ({
  on: DEFAULT_ON,
  runs: [],
  toggle: (s) => set((st) => ({ on: st.on.includes(s) ? st.on.filter((x) => x !== s) : [...st.on, s] })),
  run: () => {
    const { results, score } = runTestSet(new Set(get().on));
    set((st) => ({ runs: [...st.runs, { version: st.runs.length + 1, score, results, at: performance.now() }].slice(-8) }));
  },
}));

/** Which stage each section belongs to in the walkthrough. */
const STAGE_OF: Record<Section, string> = {
  role: "role",
  goal: "goal",
  rules: "rules",
  reasons: "rules",
  format: "format",
  examples: "examples",
  missingInfo: "missing-info",
  contradiction: "rules",
};

const SLAB_Y = (k: number) => 0.4 + k * 0.75;

export function PromptStackView() {
  const { on, runs } = usePromptStack();
  const stage = useLab((s) => s.stageId);
  const setStagePoints = useLab((s) => s.setStagePoints);
  const last = runs[runs.length - 1];
  const modelId = useModelId();
  // Re-render while the cubes flip one by one after a run.
  useTicker(Boolean(last && performance.now() - last.at < TEST_SET.length * 60 + 200), 50);

  useEffect(() => {
    const pts: Record<string, Vec3> = { "test-set": [7, 0, 5] };
    SECTIONS.forEach((s) => (pts[STAGE_OF[s.id]] ??= [-6, 0, 5]));
    setStagePoints(pts);
  }, [setStagePoints]);

  const labels: LabLabel[] = SECTIONS.map((s, k) => ({
    id: s.id,
    world: [-6, SLAB_Y(k) + 0.1, 3.4] as Vec3,
    text: s.label,
    sub: on.includes(s.id) ? s.text.length > 58 ? s.text.slice(0, 56) + "…" : s.text : "off",
    tone: stage === STAGE_OF[s.id] ? "accent" : s.bad && on.includes(s.id) ? "bad" : on.includes(s.id) ? "default" : "muted",
    size: "sm",
  }));
  labels.push({ id: "title", world: [-6, SLAB_Y(SECTIONS.length) + 0.6, 0], text: "System prompt", tone: "plain", size: "md" });
  labels.push({
    id: "score",
    world: [7, 5.2, 0],
    text: last ? `v${last.version}: ${last.score} of ${TEST_SET.length} pass` : "Test set: 12 questions",
    sub: runs.length > 1 ? `v${runs[runs.length - 2].version} scored ${runs[runs.length - 2].score}` : last ? undefined : "Press Run test set",
    tone: last ? (last.score === TEST_SET.length ? "good" : last.score >= 8 ? "warn" : "bad") : stage === "test-set" ? "accent" : "plain",
    size: "lg",
  });
  TEST_SET.forEach((t, k) => {
    labels.push({ id: `q${t.id}`, world: [4 + (k % 4) * 2, 0.2, -2.2 + Math.floor(k / 4) * 2.3] as Vec3, text: String(t.id), size: "sm", tone: "plain" });
  });
  useSceneLabels("prompt-stack", labels, `${on.join()}:${runs.length}:${stage}`);

  return (
    <group>
      <Stage size={[28, 18]} />
      {SECTIONS.map((s, k) => {
        const isOn = on.includes(s.id);
        return (
          <Box
            key={s.id}
            position={[-6, SLAB_Y(k), isOn ? 0 : -0.6]}
            size={[7, 0.55, 5]}
            color={s.bad ? lc.pink : isOn ? (stage === STAGE_OF[s.id] ? lc.accentSoft : [lc.node, lc.nodeAlt][k % 2]) : lc.dim}
            opacity={isOn ? 1 : 0.35}
            explain={s.id}
            onClick={() => usePromptStack.getState().toggle(s.id)}
          />
        );
      })}
      {TEST_SET.map((t, k) => {
        const r = last?.results.find((x) => x.id === t.id);
        // Cubes flip one after another after each run.
        const flipped = last ? performance.now() - last.at > k * 60 : false;
        return (
          <Box
            key={t.id}
            position={[4 + (k % 4) * 2, 0.75, -2.2 + Math.floor(k / 4) * 2.3]}
            size={[1.4, 1.4, 1.4]}
            color={!r || !flipped ? lc.nodeAlt : r.pass ? lc.mint : lc.pink}
            emissive={stage === "test-set" ? lc.accent : undefined}
            emissiveIntensity={0.1}
            onClick={(e) =>
              useExplain.getState().show(modelId, "test", [e.point.x, e.point.y + 0.8, e.point.z], {
                title: `Test ${t.id}: ${t.kind}`,
                body: `"${t.question}" ${r ? (r.pass ? "Passes with this prompt." : `Fails: ${r.reason.toLowerCase()}.`) : "Run the test set to score it."} Needs: ${t.needs.map((n) => SECTIONS.find((x) => x.id === n)!.label).join(", ")}.`,
              })
            }
          />
        );
      })}
    </group>
  );
}

export function PromptStackControls() {
  const { on, runs, toggle, run } = usePromptStack();
  const last = runs[runs.length - 1];
  return (
    <div className="lc">
      <div className="lc__toggles">
        {SECTIONS.map((s) => (
          <Toggle key={s.id} id={`ps-${s.id}`} label={s.label} checked={on.includes(s.id)} onChange={() => toggle(s.id)} />
        ))}
      </div>
      <button className="btn btn--primary" onClick={run}>
        Run test set
      </button>
      <div className="lc__metrics">
        <Metric label="Version" value={last ? `v${last.version}` : "–"} />
        <Metric label="Score" value={last ? `${last.score}/${TEST_SET.length}` : "–"} tone={last ? (last.score === 12 ? "good" : last.score >= 8 ? "warn" : "bad") : undefined} />
        <Metric label="History" value={runs.length ? runs.map((r) => r.score).join(" → ") : "–"} />
      </div>
      {last && (
        <table className="lc__table">
          <thead>
            <tr>
              <th>#</th>
              <th>Test question</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {TEST_SET.map((t) => {
              const r = last.results.find((x) => x.id === t.id)!;
              return (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>
                    {t.question}
                    <br />
                    <span style={{ color: "var(--ink-faint)", fontSize: 11 }}>{t.kind}</span>
                  </td>
                  <td>
                    <span className={`pill ${r.pass ? "pill--boarding" : "pill--error"}`}>{r.pass ? "Pass" : r.reason}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="step__lead" style={{ fontSize: 12 }}>
        This scorer is simulated: each question lists the sections it needs. It shows which kinds of question each section helps.
      </p>
    </div>
  );
}
