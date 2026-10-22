import { palette } from "../../app/theme";

/** The airport's control tower. Stands for observability across all buildings; its light shows overall health. */
export function ControlTower({ position, light = palette.success }: { position: [number, number]; light?: string }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.6, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[4, 4.4, 1.2, 24]} />
        <meshStandardMaterial color={palette.buildingAlt} roughness={0.9} />
      </mesh>
      <mesh position={[0, 11, 0]} castShadow>
        <cylinderGeometry args={[1.3, 1.8, 20, 16]} />
        <meshStandardMaterial color={palette.building} roughness={0.8} />
      </mesh>
      <mesh position={[0, 21.6, 0]} castShadow>
        <cylinderGeometry args={[3.2, 2.4, 1.2, 8]} />
        <meshStandardMaterial color={palette.building} roughness={0.8} />
      </mesh>
      <mesh position={[0, 23.3, 0]}>
        <cylinderGeometry args={[3.4, 3.2, 2.2, 8]} />
        <meshStandardMaterial color={palette.glass} transparent opacity={0.55} roughness={0.1} />
      </mesh>
      <mesh position={[0, 24.7, 0]} castShadow>
        <cylinderGeometry args={[3.7, 3.5, 0.6, 8]} />
        <meshStandardMaterial color={palette.buildingAlt} />
      </mesh>
      <mesh position={[0, 25.6, 0]}>
        <sphereGeometry args={[0.45, 12, 12]} />
        <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}
