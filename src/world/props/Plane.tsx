import { forwardRef } from "react";
import type { Group } from "three";
import type { ThreeElements } from "@react-three/fiber";
import { palette } from "../../app/theme";

type Props = ThreeElements["group"];

/** A low-poly airliner about 14 m long, nose pointing along local +x. */
export const Plane = forwardRef<Group, Props>(function Plane(props, ref) {
  return (
    <group ref={ref} {...props}>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.85, 0.85, 11, 12]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 2]} position={[6.4, 1.6, 0]} castShadow>
        <coneGeometry args={[0.85, 1.8, 12]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-6.3, 1.75, 0]} castShadow>
        <coneGeometry args={[0.85, 1.6, 12]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
      </mesh>
      {/* Wings and engines */}
      <mesh position={[0.4, 1.3, 0]} castShadow>
        <boxGeometry args={[2.4, 0.16, 13]} />
        <meshStandardMaterial color={palette.buildingAlt} roughness={0.6} />
      </mesh>
      {[-3, 3].map((z) => (
        <mesh key={z} rotation={[0, 0, Math.PI / 2]} position={[1.2, 0.8, z]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 1.6, 10]} />
          <meshStandardMaterial color={palette.buildingAlt} roughness={0.5} />
        </mesh>
      ))}
      {/* Tail */}
      <mesh position={[-5.8, 3.2, 0]} castShadow>
        <boxGeometry args={[1.8, 2.6, 0.14]} />
        <meshStandardMaterial color={palette.accent} roughness={0.5} />
      </mesh>
      <mesh position={[-6, 1.9, 0]} castShadow>
        <boxGeometry args={[1.2, 0.12, 4.6]} />
        <meshStandardMaterial color={palette.buildingAlt} roughness={0.6} />
      </mesh>
    </group>
  );
});
