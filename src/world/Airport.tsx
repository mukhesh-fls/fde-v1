import { layout, modules } from "../content/modules";
import { Ambient } from "./Ambient";
import { Building } from "./buildings/Building";
import { LabPavilion } from "./buildings/LabPavilion";
import { Ground } from "./Ground";
import { ControlTower } from "./props/ControlTower";

/** The aerial overview: ground, roads, runway, all 17 module buildings and ambient life. */
export function Airport() {
  return (
    <group>
      <Ground />
      {modules.map((m) => (
        <Building key={m.id} module={m} />
      ))}
      <LabPavilion />
      <ControlTower position={layout.controlTower.position} />
      <Ambient />
    </group>
  );
}
