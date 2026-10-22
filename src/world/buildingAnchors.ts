import { modules } from "../content/modules";
import { LAB_POSITION } from "../engine/framings";
import type { Anchor } from "../engine/labelAnchors";

/** Where each building's label sits: just above its roof. */
export const buildingAnchors: Anchor[] = modules.map((m) => ({
  id: m.id,
  world: [m.building.position[0], m.building.height + 3, m.building.position[1]],
}));
buildingAnchors.push({ id: "lab", world: [LAB_POSITION[0], 11, LAB_POSITION[1]] });
