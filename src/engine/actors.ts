import { Vector3 } from "three";
import type { InteriorDef } from "../content/lessons";
import type { Panel } from "../store/ui";

/** Live positions of the two characters, shared with the label layer (Ravi's bubble follows him). */
export const actors = { learner: new Vector3(0, 0, 19), ravi: new Vector3(-3, 0, 17) };

const STAND_OFFSET = 4.6;

/** Where the learner stands for a station or the exam gate. */
export function standPoint(interior: InteriorDef, panel: Panel): [number, number] | null {
  if (panel?.kind === "lesson") {
    const s = interior.stations[panel.lessonId];
    return s ? [s.position[0], s.position[1] + STAND_OFFSET] : null;
  }
  if (panel?.kind === "exam") {
    const g = interior.examGate.position;
    return [g[0] - 3, g[1] - 1];
  }
  return null;
}

/** Ravi stands beside the learner at a station, or waits by the next station to guide them there. */
export function raviPoint(interior: InteriorDef, panel: Panel, nextLessonId: string | null): [number, number] {
  const stand = standPoint(interior, panel);
  if (stand) return [stand[0] + 2.2, stand[1] - 0.6];
  if (nextLessonId && interior.stations[nextLessonId]) {
    const s = interior.stations[nextLessonId].position;
    return [s[0] - 3, s[1] + STAND_OFFSET + 0.4];
  }
  const g = interior.examGate.position;
  return [g[0] - 4, g[1] - 2];
}

/**
 * Walks a position towards a target. The speed is fixed when a new target is set, so every walk
 * finishes within `maxSeconds` (the brief asks for under 2 s) without slowing down near the end.
 */
export function makeWalker(maxSeconds = 1.8, minSpeed = 5) {
  let current: [number, number] | null = null;
  let speed = minSpeed;
  return (pos: Vector3, target: [number, number], dt: number): number | null => {
    const dx = target[0] - pos.x;
    const dz = target[1] - pos.z;
    const dist = Math.hypot(dx, dz);
    if (!current || current[0] !== target[0] || current[1] !== target[1]) {
      current = target;
      speed = Math.max(minSpeed, dist / maxSeconds);
    }
    if (dist < 0.05) return null;
    const move = Math.min(dist, speed * dt);
    pos.x += (dx / dist) * move;
    pos.z += (dz / dist) * move;
    return Math.atan2(dx, dz);
  };
}
