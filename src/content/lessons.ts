import type { ExamDef, LessonDef, ModuleLessons, Vec2 } from "./types";

// Every module's lessons, exam and interior live in content/<moduleId>/. Adding a module means adding files there.
const lessonFiles = import.meta.glob<ModuleLessons>("../../content/*/lessons.json", { eager: true, import: "default" });
const examFiles = import.meta.glob<ExamDef>("../../content/*/exam.json", { eager: true, import: "default" });
const interiorFiles = import.meta.glob<InteriorDef>("../../content/*/interior.json", { eager: true, import: "default" });

export type StationProp =
  | "ground-staff"
  | "check-in"
  | "gate"
  | "rebooking"
  | "cargo"
  | "hangar"
  | "records"
  | "tower-room";

export type InteriorDef = {
  floor: { min: Vec2; max: Vec2 };
  entrance: Vec2;
  stations: Record<string, { position: Vec2; prop: StationProp }>;
  examGate: { position: Vec2; label: string };
  modelCity: { position: Vec2 };
};

const byModule = <T,>(files: Record<string, T>) => {
  const out: Record<string, T> = {};
  for (const [path, value] of Object.entries(files)) {
    const id = path.split("/").slice(-2, -1)[0];
    out[id] = value;
  }
  return out;
};

const lessonsByModule = byModule(lessonFiles);
const examsByModule = byModule(examFiles);
const interiorsByModule = byModule(interiorFiles);

export function lessonsFor(moduleId: string): LessonDef[] {
  return [...(lessonsByModule[moduleId]?.lessons ?? [])].sort((a, b) => a.slot - b.slot);
}
export const examFor = (moduleId: string): ExamDef | null => examsByModule[moduleId] ?? null;
export const interiorFor = (moduleId: string): InteriorDef | null => interiorsByModule[moduleId] ?? null;
export const hasInterior = (moduleId: string) => Boolean(interiorsByModule[moduleId] && lessonsByModule[moduleId]);

export function findLesson(lessonId: string): { moduleId: string; lesson: LessonDef } | null {
  for (const [moduleId, file] of Object.entries(lessonsByModule)) {
    const lesson = file.lessons.find((l) => l.id === lessonId);
    if (lesson) return { moduleId, lesson };
  }
  return null;
}
