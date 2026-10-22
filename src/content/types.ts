export type Level = "L1" | "L2" | "L3" | "FDE";
export type ModuleStatus = "boarding" | "scheduled" | "completed" | "delayed";
export type BuildingShape = "terminal" | "block" | "hangar";

export type Vec2 = [number, number];

export type BuildingLayout = {
  position: Vec2;
  footprint: Vec2;
  height: number;
  shape: BuildingShape;
};

export type ModuleDef = {
  id: string;
  code: string;
  level: Level;
  title: string;
  building: { name: string } & BuildingLayout;
  status: ModuleStatus;
  stations: string[];
};

export type Strip = { from: number; to: number; width: number };
export type Rect = { min: Vec2; max: Vec2 };

export type AirportLayout = {
  ground: Rect;
  runway: Strip & { z: number };
  taxiway: Strip & { z: number };
  roadLoop: Rect & { width: number };
  curbRoad: Strip & { z: number };
  entranceRoad: Strip & { x: number };
  partnerLink: Strip & { z: number };
  partnerDistrict: Rect;
  terminalApron: Rect;
  controlTower: { position: Vec2 };
  buildings: Record<string, BuildingLayout>;
};

export type Question = { prompt: string; options: string[]; answer: number; explain: string };

export type LearnSection = { heading: string; body: string; code?: string };

export type Step =
  | { kind: "brief"; mentor: string[] }
  | { kind: "predict"; question: Question }
  | {
      kind: "learn";
      video: { title: string; durationSec: number; src: string | null };
      sections: LearnSection[];
      keyPoints: string[];
    }
  | { kind: "check"; passMark: number; questions: Question[] }
  | { kind: "certified"; stamp: string; upgrade: string };

export type StepKind = Step["kind"];

export type LessonDef = {
  id: string;
  slot: number;
  title: string;
  topic: string;
  summary: string;
  steps: Step[];
  review: Question[];
};

export type ModuleLessons = { moduleId: string; lessons: LessonDef[] };

export type ExamDef = { moduleId: string; title: string; passMark: number; questions: Question[] };
