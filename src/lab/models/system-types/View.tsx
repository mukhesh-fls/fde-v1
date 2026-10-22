import { useEffect, useMemo } from "react";
import { create } from "zustand";
import type { Vec3 } from "../../../engine/labelAnchors";
import { useSceneLabels, type LabLabel } from "../../labels";
import { along, CurveTube, elapsed, lc, Node, Pulse, Stage } from "../../primitives";
import { useLab } from "../../store";
import { LANE_NODES, runTask, SYSTEM_TYPES, type SystemType, type TaskKind } from "./logic";

export const useSystemTypes = create<{ task: TaskKind; startedAt: number | null; send: () => void; setTask: (t: TaskKind) => void }>((set) => ({
  task: "open",
  startedAt: null,
  send: () => set({ startedAt: performance.now() }),
  setTask: (task) => set({ task, startedAt: null }),
}));

export const HOP_SECONDS = 0.45;
const LANE_Z: Record<SystemType, number> = { chatbot: -8, workflow: -2.7, agent: 2.7, "multi-agent": 8 };
const LANE_TITLE: Record<SystemType, string> = { chatbot: "Chatbot", workflow: "Workflow", agent: "Agent", "multi-agent": "Multi-agent" };

/** x/z offset of each node within its lane. */
const LAYOUT: Record<SystemType, Record<string, [number, number]>> = {
  chatbot: { in: [-11, 0], model: [0, 0], out: [11, 0] },
  workflow: { in: [-12, 0], s1: [-6, 0], s2: [0, 0], s3: [6, 0], out: [12, 0] },
  agent: { in: [-12, 0], model: [-3, 0], search: [4.5, -1.5], db: [4.5, 1.5], out: [12, 0] },
  "multi-agent": { in: [-12, 0], lead: [-5, 0], w1: [3, -1.5], w2: [3, 1.5], out: [12, 0] },
};
const LINKS: Record<SystemType, [string, string][]> = {
  chatbot: [["in", "model"], ["model", "out"]],
  workflow: [["in", "s1"], ["s1", "s2"], ["s2", "s3"], ["s3", "out"]],
  agent: [["in", "model"], ["model", "search"], ["model", "db"], ["model", "out"]],
  "multi-agent": [["in", "lead"], ["lead", "w1"], ["lead", "w2"], ["lead", "out"]],
};

const pos = (type: SystemType, id: string, y = 0.6): Vec3 => {
  const [x, dz] = LAYOUT[type][id];
  return [x, y, LANE_Z[type] + dz];
};

export function SystemTypesView() {
  const { task, startedAt } = useSystemTypes();
  const stage = useLab((s) => s.stageId);
  const setStagePoints = useLab((s) => s.setStagePoints);
  const results = useMemo(() => SYSTEM_TYPES.map((t) => runTask(t, task)), [task]);

  useEffect(() => {
    setStagePoints(Object.fromEntries(SYSTEM_TYPES.map((t) => [t, [-15, 0, LANE_Z[t] + 1.4] as Vec3])));
  }, [setStagePoints]);

  const labels: LabLabel[] = [];
  for (const t of SYSTEM_TYPES) {
    labels.push({ id: `lane-${t}`, world: [-15.5, 0.4, LANE_Z[t]], text: LANE_TITLE[t], tone: stage === t ? "accent" : "plain", size: "md" });
    for (const n of LANE_NODES[t]) labels.push({ id: `${t}-${n.id}`, world: pos(t, n.id, 1.9), text: n.label, size: "sm", tone: stage && stage !== t ? "muted" : "default" });
  }
  if (startedAt !== null)
    results.forEach((r) => {
      labels.push({
        id: `result-${r.type}`,
        world: [15.5, 0.4, LANE_Z[r.type]],
        text: r.quality === "good" ? "Good result" : r.quality === "ok" ? "OK result" : "Poor result",
        sub: `${r.steps} steps · ${(r.tokens / 1000).toFixed(1)}k tokens`,
        tone: r.quality === "good" ? "good" : r.quality === "ok" ? "warn" : "bad",
      });
    });
  useSceneLabels("system-types", labels, `${task}:${startedAt}:${stage}`);

  return (
    <group>
      <Stage size={[38, 24]} />
      {SYSTEM_TYPES.map((t) => {
        const dim = Boolean(stage && stage !== t);
        const r = results.find((x) => x.type === t)!;
        const path = r.path.map((id) => pos(t, id, 1.6));
        return (
          <group key={t}>
            {LINKS[t].map(([a, b]) => (
              <CurveTube key={a + b} points={[pos(t, a, 0.6), pos(t, b, 0.6)]} arcHeight={0.6} radius={0.08} color={dim ? lc.dim : lc.edge} />
            ))}
            {LANE_NODES[t].map((n) => (
              <Node
                key={n.id}
                position={pos(t, n.id, 0)}
                size={n.id === "in" || n.id === "out" ? [2.4, 0.8, 1.6] : [2.8, 1.1, 1.8]}
                dim={dim}
                active={stage === t && (n.id === "model" || n.id === "lead" || t === "workflow")}
                tint={n.id === "model" || n.id === "lead" ? lc.accentSoft : undefined}
                explain={`${t}-${n.id}`}
              />
            ))}
            <Pulse
              color={r.quality === "good" ? lc.accent : r.quality === "ok" ? lc.warn : lc.bad}
              at={() => {
                const e = elapsed(useSystemTypes.getState().startedAt);
                if (e === null) return null;
                const t01 = e / (HOP_SECONDS * (path.length - 1));
                return t01 > 1.15 ? null : along(path, t01);
              }}
            />
          </group>
        );
      })}
    </group>
  );
}

export function SystemTypesControls() {
  const { task, setTask, send, startedAt } = useSystemTypes();
  const results = SYSTEM_TYPES.map((t) => runTask(t, task));
  return (
    <div className="lc">
      <label className="lc__field">
        <span>Task</span>
        <select id="st-task" value={task} onChange={(e) => setTask(e.target.value as TaskKind)}>
          <option value="simple">Simple question</option>
          <option value="process">Known 3-step process</option>
          <option value="open">Open-ended research task</option>
        </select>
      </label>
      <button className="btn btn--primary" onClick={send}>
        Send task
      </button>
      {startedAt !== null && (
        <table className="lc__table">
          <thead>
            <tr>
              <th>System</th>
              <th>Steps</th>
              <th>Time</th>
              <th>Tokens</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.type} title={r.note}>
                <td>{LANE_TITLE[r.type]}</td>
                <td>{r.steps}</td>
                <td>{r.seconds} s</td>
                <td>{(r.tokens / 1000).toFixed(1)}k</td>
                <td>
                  <span className={`pill pill--${r.quality === "good" ? "boarding" : r.quality === "ok" ? "delayed" : "error"}`}>{r.quality}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {startedAt !== null && (
        <ul className="lc__notes">
          {results.map((r) => (
            <li key={r.type}>
              <strong>{LANE_TITLE[r.type]}:</strong> {r.note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
