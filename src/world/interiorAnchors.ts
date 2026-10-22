import { interiorFor, lessonsFor } from "../content/lessons";
import { actors } from "../engine/actors";
import type { Anchor } from "../engine/labelAnchors";

/** Label anchors inside a building: one per station, the exam gate, Model City, and Ravi's bubble (moving). */
export function interiorAnchors(moduleId: string): Anchor[] {
  const interior = interiorFor(moduleId);
  if (!interior) return [];
  const stations = lessonsFor(moduleId).map<Anchor>((l) => {
    const [x, z] = interior.stations[l.id].position;
    return { id: l.id, world: [x, 4.6, z] };
  });
  const [gx, gz] = interior.examGate.position;
  const [mx, mz] = interior.modelCity.position;
  return [
    ...stations,
    { id: "exam", world: [gx, 4.4, gz] },
    { id: "model-city", world: [mx, 13.5, mz] },
    { id: "ravi", world: () => [actors.ravi.x, 2.7, actors.ravi.z] },
  ];
}
