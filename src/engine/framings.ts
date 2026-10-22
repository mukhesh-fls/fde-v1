import { layout } from "../content/modules";
import { interiorFor } from "../content/lessons";

export type Framing = { position: [number, number, number]; target: [number, number, number] };

export const OVERVIEW: Framing = { position: [52, 200, 238], target: [22, 0, 2] };

/** Close to a building's front, used as the last frame of the fly-in before the interior appears. */
export function approachFraming(moduleId: string): Framing {
  const b = layout.buildings[moduleId];
  const [x, z] = b.position;
  return { position: [x + 6, b.height + 26, z + 34], target: [x, b.height * 0.4, z] };
}

// Aimed left of centre so the hall sits to the right of the lesson list.
/** The lab pavilion on the overview: in the landscaped area west of the entrance road. */
export const LAB_POSITION: [number, number] = [-96, 48];
export const LAB_APPROACH: Framing = { position: [LAB_POSITION[0] + 6, 28, LAB_POSITION[1] + 34], target: [LAB_POSITION[0], 3, LAB_POSITION[1]] };

export const INTERIOR: Framing = { position: [-7, 70, 63], target: [-7, 0, -1] };

export function stationFraming(moduleId: string, lessonId: string): Framing {
  const s = interiorFor(moduleId)?.stations[lessonId];
  if (!s) return INTERIOR;
  const [x, z] = s.position;
  // Centred: the lesson list (left) and the panel (right) leave the middle of the screen free.
  return { position: [x + 3, 28, z + 30], target: [x + 1.5, 0, z] };
}

export function examFraming(moduleId: string): Framing {
  const g = interiorFor(moduleId)?.examGate.position ?? [0, 0];
  return { position: [g[0] + 3, 28, g[1] + 30], target: [g[0] + 1.5, 0, g[1]] };
}
