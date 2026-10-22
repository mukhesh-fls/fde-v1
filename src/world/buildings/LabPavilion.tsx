import type { ThreeEvent } from "@react-three/fiber";
import { palette } from "../../app/theme";
import { LAB_POSITION } from "../../engine/framings";
import { enterLab } from "../../engine/navigation";
import { useUi } from "../../store/ui";

const NODES: [number, number, number][] = [
  [-3, 0, -1],
  [-3, 0, 1.5],
  [0, 0.8, -2],
  [0, 0.8, 0.2],
  [0, 0.8, 2.2],
  [3, 0.3, 0],
];

/** The AI Systems Lab: a glass pavilion with a small neural-network sculpture on the roof. */
export function LabPavilion() {
  const hovered = useUi((s) => s.hoveredModuleId === "lab");
  const setHovered = useUi((s) => s.setHovered);
  const [x, z] = LAB_POSITION;
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered("lab");
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    if (useUi.getState().hoveredModuleId === "lab") setHovered(null);
    document.body.style.cursor = "";
  };
  return (
    <group
      position={[x, 0, z]}
      onPointerOver={over}
      onPointerOut={out}
      onClick={(e) => {
        e.stopPropagation();
        void enterLab();
      }}
    >
      <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
        <boxGeometry args={[22, 0.6, 16]} />
        <meshStandardMaterial color={palette.buildingAlt} roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.6, 0]} castShadow>
        <boxGeometry args={[16, 6, 10]} />
        <meshStandardMaterial color={palette.glass} transparent opacity={hovered ? 0.6 : 0.45} roughness={0.1} metalness={0.1} />
      </mesh>
      <mesh position={[0, 6.8, 0]} castShadow>
        <boxGeometry args={[18, 0.5, 12]} />
        <meshStandardMaterial color={palette.building} roughness={0.8} />
      </mesh>
      <group position={[0, 8, 0]}>
        {NODES.map((p, i) => (
          <mesh key={i} position={p} castShadow>
            <sphereGeometry args={[0.55, 16, 12]} />
            <meshStandardMaterial color={i === 5 ? palette.accent : palette.building} emissive={palette.accent} emissiveIntensity={i === 5 ? 0.4 : 0.05} />
          </mesh>
        ))}
      </group>
      {hovered && (
        <mesh position={[0, 0.65, 0]}>
          <boxGeometry args={[23, 0.05, 17]} />
          <meshBasicMaterial color={palette.accent} transparent opacity={0.25} />
        </mesh>
      )}
    </group>
  );
}
