import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Mesh } from "three";
import { AdditiveBlending } from "three";
import { create } from "zustand";
import type { Vec3 } from "../../../engine/labelAnchors";
import { useSceneLabels, type LabLabel } from "../../labels";
import { useExplain, useModelId } from "../../explain";
import { lc, Orb, Stage, Tube } from "../../primitives";
import { useLab } from "../../store";
import { Slider } from "../../ui/controls";
import { QUERY_PRESETS, TOPICS, type Topic } from "./chunks";
import { embed, INDEX, project, search, type Mode } from "./logic";

type S = { draft: string; query: string; mode: Mode; k: number; searchedAt: number | null; setDraft: (q: string) => void; setMode: (m: Mode) => void; setK: (k: number) => void; run: (q?: string) => void };
export const useEmbedding = create<S>((set, get) => ({
  draft: QUERY_PRESETS[0],
  query: QUERY_PRESETS[0],
  mode: "meaning",
  k: 4,
  searchedAt: null,
  setDraft: (draft) => set({ draft }),
  setMode: (mode) => set({ mode }),
  setK: (k) => set({ k }),
  run: (q) => set({ query: q ?? get().draft, draft: q ?? get().draft, searchedAt: performance.now() }),
}));

const TOPIC_COLOR: Record<Topic, string> = { refunds: lc.mint, baggage: lc.butter, changes: lc.sky, documents: lc.lavender, loyalty: lc.teal, assistance: lc.pink };

export function EmbeddingLookupView() {
  const { query, mode, k, searchedAt } = useEmbedding();
  const stage = useLab((s) => s.stageId);
  const setStagePoints = useLab((s) => s.setStagePoints);
  const hits = useMemo(() => search(query, mode, k), [query, mode, k]);
  const qPos = useMemo<Vec3 | null>(() => (query ? project(embed(query)) : null), [query]);
  const queryMesh = useRef<Mesh>(null);
  const modelId = useModelId();
  const hitIds = new Set(hits.map((h) => h.chunk.id));

  const centres = useMemo(
    () =>
      TOPICS.map((t) => {
        const pts = INDEX.filter((c) => c.topic === t.id).map((c) => c.position);
        const c: Vec3 = [0, 0, 0];
        pts.forEach((p) => p.forEach((v, i) => (c[i] += v / pts.length)));
        return { topic: t, centre: c };
      }),
    [],
  );

  useEffect(() => {
    setStagePoints({ chunks: [-10, 0, 10], embed: [-4, 0, 12], query: qPos ? [qPos[0], 0, qPos[2] + 3] : [0, 0, 6], nearest: qPos ? [qPos[0] + 2, 0, qPos[2] + 3] : [0, 0, 6], keywords: [6, 0, 12], "into-context": [10, 0, 10] });
  }, [setStagePoints, qPos]);

  // The query point drops in from above after each search.
  useFrame(() => {
    const m = queryMesh.current;
    if (!m || !qPos) return;
    const e = searchedAt === null ? 1 : Math.min(1, (performance.now() - searchedAt) / 600);
    m.position.set(qPos[0], qPos[1] + (1 - e) * 8, qPos[2]);
    m.scale.setScalar(0.6 + 0.4 * e);
  });

  const labels: LabLabel[] = centres.map(({ topic, centre }) => ({
    id: topic.id,
    world: [centre[0] * 1.25, centre[1] + 3.4, centre[2] * 1.25] as Vec3,
    text: topic.label,
    tone: stage === "chunks" ? "accent" : "plain",
    size: "md",
  }));
  hits.forEach((h) => {
    labels.push({
      id: `hit-${h.chunk.id}`,
      world: [h.chunk.position[0], h.chunk.position[1] + 1.1, h.chunk.position[2]],
      text: `#${h.rank} ${h.chunk.id}`,
      sub: mode === "meaning" ? `similarity ${h.score.toFixed(2)}` : mode === "keywords" ? `keyword score ${h.score.toFixed(1)}` : "combined rank",
      tone: h.rank === 1 ? "accent" : "default",
      size: "sm",
    });
  });
  if (qPos) labels.push({ id: "query", world: [qPos[0], qPos[1] + 1.6, qPos[2]], text: `“${query}”`, sub: mode === "keywords" ? "matched by exact words" : "your query as a vector", tone: "accent", size: "md" });
  useSceneLabels("embedding-lookup", labels, `${query}:${mode}:${k}:${stage}`);

  return (
    <group>
      <Stage size={[44, 36]} />
      {INDEX.map((c) => {
        const hit = hitIds.has(c.id);
        const dim = Boolean(query && !hit);
        const topic = TOPICS.find((t) => t.id === c.topic)!.label;
        return (
          <Orb
            key={c.id}
            position={c.position}
            radius={hit ? 0.68 : 0.48}
            color={TOPIC_COLOR[c.topic]}
            opacity={dim ? 0.4 : 1}
            glow={hit ? 0.9 : 0.05}
            onClick={() =>
              useExplain.getState().show(modelId, "chunk", [c.position[0], c.position[1] + 0.9, c.position[2]], {
                title: `${c.id} · ${topic}`,
                body: `"${c.text}" Its vector places it near the other ${topic.toLowerCase()} chunks.`,
              })
            }
          />
        );
      })}
      {/* A soft glow over each region of meaning */}
      {centres.map(({ topic, centre }) => (
        <mesh key={`halo-${topic.id}`} position={centre}>
          <sphereGeometry args={[3.6, 32, 24]} />
          <meshBasicMaterial color={TOPIC_COLOR[topic.id]} transparent opacity={stage === "chunks" ? 0.12 : 0.06} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
        </mesh>
      ))}
      {/* Faint stems to the floor make the 3D positions readable */}
      {INDEX.map((c) => (
        <Tube key={`s-${c.id}`} from={[c.position[0], 0, c.position[2]]} to={c.position} radius={0.025} color={lc.dim} />
      ))}
      {qPos && (
        <>
          <mesh
            ref={queryMesh}
            position={qPos}
            onClick={(e) => {
              e.stopPropagation();
              useExplain.getState().show(modelId, "query", [qPos[0], qPos[1] + 1.2, qPos[2]]);
            }}
          >
            <octahedronGeometry args={[0.85, 0]} />
            <meshStandardMaterial color="#ffffff" emissive={lc.accent} emissiveIntensity={1.8} toneMapped={false} />
          </mesh>
          {hits.map((h) => (
            <Tube key={`l-${h.chunk.id}-${mode}`} from={qPos} to={h.chunk.position} radius={0.04 + (h.rank === 1 ? 0.06 : 0.02)} color={mode === "keywords" ? lc.butter : lc.sky} glow={stage === "nearest" || stage === "keywords" ? 1.5 : 0.8} explain="link" />
          ))}
        </>
      )}
    </group>
  );
}

export function EmbeddingLookupControls() {
  const { draft, query, mode, k, setDraft, setMode, setK, run } = useEmbedding();
  const hits = useMemo(() => search(query, mode, k), [query, mode, k]);
  return (
    <div className="lc">
      <form
        className="lc__field"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <label htmlFor="el-q">Query</label>
        <input id="el-q" type="text" value={draft} maxLength={120} onChange={(e) => setDraft(e.target.value)} />
      </form>
      <div className="lc__presets">
        {QUERY_PRESETS.map((p) => (
          <button key={p} className={p === query ? "is-on" : ""} onClick={() => run(p)}>
            {p}
          </button>
        ))}
      </div>
      <label className="lc__field" htmlFor="el-mode">
        <span>Search by</span>
        <select id="el-mode" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
          <option value="meaning">Meaning (vectors)</option>
          <option value="keywords">Keywords (exact words)</option>
          <option value="both">Both (hybrid)</option>
        </select>
      </label>
      <Slider id="el-k" label="Top k" value={k} min={1} max={8} step={1} onChange={setK} />
      <button className="btn btn--primary" onClick={() => run()}>
        Search
      </button>
      {query && (
        <>
          <p className="step__lead" style={{ fontSize: 12.5 }}>
            {hits.length
              ? `These ${hits.length} chunks would go into the model's context window, not all ${INDEX.length}.`
              : "No chunk shares an exact word with this query. Try Meaning or Both."}
          </p>
          <ol className="lc__hits">
            {hits.map((h) => (
              <li key={h.chunk.id}>
                <code>
                  #{h.rank} {h.chunk.id}
                </code>
                <span>{h.chunk.text}</span>
                <b>{mode === "both" ? "" : h.score.toFixed(2)}</b>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
