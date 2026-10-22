import type { ThreeEvent } from "@react-three/fiber";
import { palette } from "../../app/theme";
import type { InteriorDef } from "../../content/lessons";
import { interiorFor, lessonsFor } from "../../content/lessons";
import type { LessonDef, Vec2 } from "../../content/types";
import { useProgress } from "../../store/progress";
import { isCertified, isExamUnlocked, isLessonUnlocked, nextLessonId } from "../../store/progressRules";
import { useUi } from "../../store/ui";
import { Plane } from "../props/Plane";
import { Slab } from "../props/Slab";
import { StationPropView, tones } from "../props/stations/StationProps";
import { Characters } from "./Characters";

const MODULE_ID = "m01";
const WALL_H = 6.5;

/** Terminal 1 with the roof off: eight station areas, the exam gate, and Model City outside to the north. */
export function Terminal1Interior() {
  const interior = interiorFor(MODULE_ID)!;
  const lessons = lessonsFor(MODULE_ID);
  const ids = lessons.map((l) => l.id);
  const progress = useProgress();
  const next = nextLessonId(progress, ids);
  const { min, max } = interior.floor;

  return (
    <group>
      <Outside interior={interior} />
      {/* Floor and a guide line through the stations in order */}
      <Slab rect={{ min, max }} color="#F8F9FB" thickness={0.3} />
      <GuidePath points={[interior.entrance, ...ids.map((id) => interior.stations[id].position), interior.examGate.position]} />
      <Walls min={min} max={max} />

      {lessons.map((lesson) => (
        <StationArea
          key={lesson.id}
          lesson={lesson}
          position={interior.stations[lesson.id].position}
          prop={interior.stations[lesson.id].prop}
          unlocked={isLessonUnlocked(progress, ids, lesson.id)}
          certified={isCertified(progress, lesson.id)}
          isNext={lesson.id === next}
        />
      ))}
      <ExamGate interior={interior} unlocked={isExamUnlocked(progress, ids)} passed={Boolean(progress.exams[MODULE_ID]?.passedAt)} />
      <Characters interior={interior} nextLessonId={next} />
    </group>
  );
}

function Walls({ min, max }: { min: Vec2; max: Vec2 }) {
  const w = max[0] - min[0];
  const d = max[1] - min[1];
  const t = 0.5;
  const mullions: number[] = [];
  for (let x = min[0] + 4; x < max[0]; x += 4) mullions.push(x);
  return (
    <group>
      {/* North wall: glass onto the apron and gates */}
      <mesh position={[0, WALL_H / 2, min[1] - t / 2]}>
        <boxGeometry args={[w, WALL_H, 0.2]} />
        <meshStandardMaterial color={palette.glass} transparent opacity={0.22} roughness={0.1} />
      </mesh>
      {mullions.map((x) => (
        <mesh key={x} position={[x, WALL_H / 2, min[1] - t / 2]} castShadow>
          <boxGeometry args={[0.25, WALL_H, 0.3]} />
          <meshStandardMaterial color={palette.building} />
        </mesh>
      ))}
      <mesh position={[0, WALL_H + 0.25, min[1] - t / 2]} castShadow>
        <boxGeometry args={[w + 1, 0.5, 1]} />
        <meshStandardMaterial color={palette.building} />
      </mesh>
      {/* West wall full height; south and east walls cut low so you can see in */}
      <mesh position={[min[0] - t / 2, WALL_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, WALL_H, d + t * 2]} />
        <meshStandardMaterial color={palette.building} roughness={0.85} />
      </mesh>
      <mesh position={[max[0] + t / 2, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, 1.2, d + t * 2]} />
        <meshStandardMaterial color={palette.building} roughness={0.85} />
      </mesh>
      {[
        [min[0], -3],
        [3, max[0]],
      ].map(([a, b]) => (
        <mesh key={a} position={[(a + b) / 2, 0.6, max[1] + t / 2]} castShadow receiveShadow>
          <boxGeometry args={[b - a, 1.2, t]} />
          <meshStandardMaterial color={palette.building} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function GuidePath({ points }: { points: Vec2[] }) {
  return (
    <group position={[0, 0.32, 0]}>
      {points.slice(1).map((b, i) => {
        const a = points[i];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
        return (
          <mesh key={i} position={[(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[len, 0.02, 0.18]} />
            <meshBasicMaterial color="#D5E2FA" />
          </mesh>
        );
      })}
    </group>
  );
}

type AreaProps = {
  lesson: LessonDef;
  position: Vec2;
  prop: Parameters<typeof StationPropView>[0]["prop"];
  unlocked: boolean;
  certified: boolean;
  isNext: boolean;
};

const PAD: Vec2 = [11, 8.5];

function StationArea({ lesson, position, prop, unlocked, certified, isNext }: AreaProps) {
  const hovered = useUi((s) => s.hoveredStationId === lesson.id);
  const active = useUi((s) => s.panel?.kind === "lesson" && s.panel.lessonId === lesson.id);
  const { setHoveredStation, openPanel, say } = useUi.getState();

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredStation(lesson.id);
    document.body.style.cursor = unlocked ? "pointer" : "not-allowed";
  };
  const out = () => {
    if (useUi.getState().hoveredStationId === lesson.id) setHoveredStation(null);
    document.body.style.cursor = "";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (unlocked) openPanel({ kind: "lesson", lessonId: lesson.id });
    else say(`Station ${lesson.slot} opens when you finish Station ${lesson.slot - 1}.`);
  };

  const padColor = certified ? "#EAF5EE" : unlocked ? "#FFFFFF" : "#F1F3F6";
  const edge = active || hovered ? palette.accent : certified ? palette.success : isNext ? "#9DBBF5" : "#E3E7ED";

  return (
    <group position={[position[0], 0.3, position[1]]} onPointerOver={over} onPointerOut={out} onClick={click}>
      <mesh position={[0, 0.03, 0.8]} receiveShadow>
        <boxGeometry args={[PAD[0], 0.06, PAD[1]]} />
        <meshStandardMaterial color={padColor} roughness={1} />
      </mesh>
      <Frame size={PAD} z={0.8} color={edge} thickness={active || hovered || isNext ? 0.22 : 0.12} />
      <StationPropView prop={prop} tone={unlocked ? tones.open : tones.locked} />
    </group>
  );
}

function Frame({ size: [w, d], z, color, thickness }: { size: Vec2; z: number; color: string; thickness: number }) {
  const bars: [number, number, number, number][] = [
    [0, -d / 2, w, thickness],
    [0, d / 2, w, thickness],
    [-w / 2, 0, thickness, d],
    [w / 2, 0, thickness, d],
  ];
  return (
    <group position={[0, 0.08, z]}>
      {bars.map(([x, bz, bw, bd], i) => (
        <mesh key={i} position={[x, 0, bz]}>
          <boxGeometry args={[bw, 0.02, bd]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

/** The departure gate. It opens (barrier up) once the module exam is passed. */
function ExamGate({ interior, unlocked, passed }: { interior: InteriorDef; unlocked: boolean; passed: boolean }) {
  const [x, z] = interior.examGate.position;
  const hovered = useUi((s) => s.hoveredStationId === "exam");
  const { setHoveredStation, openPanel, say } = useUi.getState();
  const tone = unlocked ? tones.open : tones.locked;
  return (
    <group
      position={[x, 0.3, z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredStation("exam");
        document.body.style.cursor = unlocked ? "pointer" : "not-allowed";
      }}
      onPointerOut={() => {
        setHoveredStation(null);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (unlocked) openPanel({ kind: "exam", moduleId: MODULE_ID });
        else say("The module exam opens when all eight stations are certified.");
      }}
    >
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[10, 0.06, 7]} />
        <meshStandardMaterial color={passed ? "#EAF5EE" : unlocked ? "#FFFFFF" : "#F1F3F6"} />
      </mesh>
      <Frame size={[10, 7]} z={0} color={hovered ? palette.accent : passed ? palette.success : unlocked ? "#9DBBF5" : "#E3E7ED"} thickness={0.18} />
      {/* Gate frame */}
      {[-2, 2].map((gx) => (
        <mesh key={gx} position={[gx, 1.3, 0]} castShadow>
          <boxGeometry args={[0.4, 2.6, 0.6]} />
          <meshStandardMaterial color={tone.trim} />
        </mesh>
      ))}
      <mesh position={[0, 2.8, 0]} castShadow>
        <boxGeometry args={[4.6, 0.5, 0.6]} />
        <meshStandardMaterial color={passed ? palette.success : unlocked ? palette.accent : tone.glass} />
      </mesh>
      {/* Barrier arm: down until the exam is passed */}
      <group position={[-1.7, 1, 0.4]} rotation={[0, 0, passed ? Math.PI / 2.2 : 0]}>
        <mesh position={[1.7, 0, 0]}>
          <boxGeometry args={[3.4, 0.14, 0.14]} />
          <meshStandardMaterial color={passed ? palette.success : palette.error} />
        </mesh>
      </group>
    </group>
  );
}

/** Outside the north wall: the apron, one parked plane, and Model City (the model provider) up the taxiway. */
function Outside({ interior }: { interior: InteriorDef }) {
  const [mx, mz] = interior.modelCity.position;
  const north = interior.floor.min[1];
  return (
    <group>
      <Slab rect={{ min: [-60, -90], max: [60, 40] }} y={-0.4} color={palette.ground} thickness={0.4} />
      <Slab rect={{ min: [-36, north - 14], max: [36, north - 1] }} color={palette.paving} thickness={0.1} />
      <Slab rect={{ min: [-3, mz + 6], max: [3, north - 14] }} color={palette.paving} thickness={0.1} />
      <Slab rect={{ min: [-0.12, mz + 6], max: [0.12, north - 14] }} y={0.1} color={palette.taxiLine} thickness={0.02} />
      <Plane position={[-14, 0, north - 8]} rotation={[0, -Math.PI / 2, 0]} />
      {/* Model City: a small separate airport */}
      <group position={[mx, 0, mz]}>
        <Slab rect={{ min: [-16, -8], max: [16, 6] }} color={palette.paving} thickness={0.12} />
        <mesh position={[-6, 2.5, -3]} castShadow>
          <boxGeometry args={[12, 5, 6]} />
          <meshStandardMaterial color={palette.building} />
        </mesh>
        <mesh position={[-6, 3, 0.05]}>
          <boxGeometry args={[11, 2, 0.1]} />
          <meshStandardMaterial color={palette.glass} transparent opacity={0.5} />
        </mesh>
        <mesh position={[8, 5, -3]} castShadow>
          <cylinderGeometry args={[0.8, 1.1, 10, 12]} />
          <meshStandardMaterial color={palette.building} />
        </mesh>
        <mesh position={[8, 10.6, -3]}>
          <cylinderGeometry args={[1.8, 1.4, 1.4, 8]} />
          <meshStandardMaterial color={palette.glass} transparent opacity={0.6} />
        </mesh>
      </group>
    </group>
  );
}
