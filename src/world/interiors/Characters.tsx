import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { palette } from "../../app/theme";
import type { InteriorDef } from "../../content/lessons";
import { actors, makeWalker, raviPoint, standPoint } from "../../engine/actors";
import { useUi } from "../../store/ui";
import { Figure } from "../props/Figure";

/** The learner's avatar and Ravi the mentor. Both walk; neither has any logic beyond where to stand. */
export function Characters({ interior, nextLessonId }: { interior: InteriorDef; nextLessonId: string | null }) {
  const learner = useRef<Group>(null);
  const ravi = useRef<Group>(null);
  const ring = useRef<Group>(null);
  const walkLearner = useMemo(() => makeWalker(), []);
  const walkRavi = useMemo(() => makeWalker(2.2, 4), []);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const panel = useUi.getState().panel;
    const target = standPoint(interior, panel);
    if (target && learner.current) {
      const h = walkLearner(actors.learner, target, dt);
      if (h !== null) learner.current.rotation.y = h;
    }
    const rTarget = raviPoint(interior, panel, nextLessonId);
    if (ravi.current) {
      const h = walkRavi(actors.ravi, rTarget, dt);
      if (h !== null) ravi.current.rotation.y = h;
      else {
        // Face the learner when standing still.
        ravi.current.rotation.y = Math.atan2(actors.learner.x - actors.ravi.x, actors.learner.z - actors.ravi.z);
      }
    }
    const t = clock.elapsedTime;
    learner.current?.position.set(actors.learner.x, 0, actors.learner.z);
    ravi.current?.position.set(actors.ravi.x, Math.abs(Math.sin(t * 2.2)) * 0.05, actors.ravi.z);
    if (ring.current) {
      ring.current.position.set(actors.ravi.x, 2.15 + Math.sin(t * 2) * 0.06, actors.ravi.z);
      ring.current.rotation.y = t * 0.8;
    }
  });

  return (
    <group>
      <Figure ref={learner} body="#FFFFFF" />
      <Figure ref={ravi} body="#1F3A68" />
      {/* A small halo marks Ravi as the mentor you can talk to. */}
      <group ref={ring}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.32, 0.05, 8, 24]} />
          <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  );
}
