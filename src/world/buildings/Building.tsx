import type { ThreeEvent } from "@react-three/fiber";
import { palette } from "../../app/theme";
import { hasInterior } from "../../content/lessons";
import { modules } from "../../content/modules";
import { enterBuilding } from "../../engine/navigation";
import type { ModuleDef } from "../../content/types";
import { useUi } from "../../store/ui";
import { isOpenStatus, useModuleStatuses } from "../../store/useModuleStatus";
import { BlockBuilding } from "./BlockBuilding";
import { Hangar } from "./Hangar";
import { Terminal1 } from "./Terminal1";

export type Look = { wall: string; roof: string; glass: string; glassOpacity: number };

export function lookFor(unlocked: boolean, hovered: boolean): Look {
  if (!unlocked)
    return {
      wall: hovered ? "#F7F9FC" : palette.lockedBuilding,
      roof: palette.lockedRoof,
      glass: palette.lockedGlass,
      glassOpacity: 0.3,
    };
  return { wall: palette.building, roof: palette.buildingAlt, glass: palette.glass, glassOpacity: 0.38 };
}

/** One module's building on the overview: shape, hover state and selection frame. Its label lives in the DOM layer. */
export function Building({ module }: { module: ModuleDef }) {
  const hovered = useUi((s) => s.hoveredModuleId === module.id);
  const setHovered = useUi((s) => s.setHovered);
  const status = useModuleStatuses()[module.id];
  const unlocked = isOpenStatus(status);
  const { position, footprint, height, shape } = module.building;
  const look = lookFor(unlocked, hovered);

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(module.id);
    document.body.style.cursor = unlocked ? "pointer" : "default";
  };
  const out = () => {
    if (useUi.getState().hoveredModuleId === module.id) setHovered(null);
    document.body.style.cursor = "";
  };

  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    openModule(module, unlocked);
  };

  return (
    <group position={[position[0], 0, position[1]]} onPointerOver={over} onPointerOut={out} onClick={click}>
      {shape === "terminal" && <Terminal1 footprint={footprint} height={height} look={look} />}
      {shape === "hangar" && <Hangar footprint={footprint} height={height} look={look} />}
      {shape === "block" && <BlockBuilding footprint={footprint} height={height} look={look} />}
      {hovered && <SelectionFrame footprint={footprint} color={unlocked ? palette.accent : palette.inkMuted} />}
    </group>
  );
}

/** A thin frame on the ground around the hovered building. */
function SelectionFrame({ footprint: [w, d], color }: { footprint: [number, number]; color: string }) {
  const pad = 2.2;
  const t = 0.35;
  const W = w + pad * 2;
  const D = d + pad * 2;
  const bars: [number, number, number, number][] = [
    [0, -D / 2, W, t],
    [0, D / 2, W, t],
    [-W / 2, 0, t, D],
    [W / 2, 0, t, D],
  ];
  return (
    <group position={[0, 0.2, 0]}>
      {bars.map(([x, z, bw, bd], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <boxGeometry args={[bw, 0.05, bd]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

/** What clicking a building (or its departures-board row) does. */
export function openModule(module: ModuleDef, unlocked: boolean) {
  const say = useUi.getState().say;
  if (!unlocked) {
    const prev = modules[modules.findIndex((m) => m.id === module.id) - 1];
    say(`${module.building.name} is locked. Pass the ${prev?.code ?? "previous"} module exam to start boarding ${module.code}.`);
    return;
  }
  if (!hasInterior(module.id)) {
    say(`${module.building.name} is being built. Its lessons arrive soon.`);
    return;
  }
  void enterBuilding(module.id);
}
