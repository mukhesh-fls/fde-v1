import type { ExamDef, ModuleStatus, Question } from "../content/types";

/** Everything we store about one learner. Plain data so it persists and tests easily. */
export type LessonProgress = {
  step: number;
  predictAnswer?: number;
  checkAnswers?: number[];
  checkScore?: number;
  attempts?: number;
  certifiedAt?: string;
};
export type ExamProgress = { attempts: number; bestScore: number; lastAnswers?: number[]; passedAt?: string };
export type ProgressData = {
  lessons: Record<string, LessonProgress>;
  exams: Record<string, ExamProgress>;
};

export const emptyProgress = (): ProgressData => ({ lessons: {}, exams: {} });

export const XP = { station: 100, perCorrectCheck: 10, exam: 300 } as const;

export function isCertified(p: ProgressData, lessonId: string) {
  return Boolean(p.lessons[lessonId]?.certifiedAt);
}

/** Stations open in order: the first is always open, each next one opens when the previous is certified. */
export function isLessonUnlocked(p: ProgressData, lessonIds: string[], lessonId: string) {
  const i = lessonIds.indexOf(lessonId);
  if (i <= 0) return i === 0;
  return isCertified(p, lessonIds[i - 1]);
}

export function nextLessonId(p: ProgressData, lessonIds: string[]) {
  return lessonIds.find((id) => !isCertified(p, id)) ?? null;
}

export function isExamUnlocked(p: ProgressData, lessonIds: string[]) {
  return lessonIds.length > 0 && lessonIds.every((id) => isCertified(p, id));
}

export function scoreAnswers(questions: Question[], answers: number[]) {
  return questions.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
}

export function examPassed(exam: ExamDef, correct: number) {
  return correct / exam.questions.length >= exam.passMark;
}

/**
 * A module's status on the departures board. The first module is always boarding;
 * each next one starts boarding when the previous module's exam is passed.
 */
export function moduleStatus(p: ProgressData, moduleIds: string[], moduleId: string): ModuleStatus {
  if (p.exams[moduleId]?.passedAt) return "completed";
  const i = moduleIds.indexOf(moduleId);
  if (i === 0) return "boarding";
  return p.exams[moduleIds[i - 1]]?.passedAt ? "boarding" : "scheduled";
}

export function totalXp(p: ProgressData) {
  let xp = 0;
  for (const l of Object.values(p.lessons)) {
    if (l.certifiedAt) xp += XP.station;
    xp += (l.checkScore ?? 0) * XP.perCorrectCheck;
  }
  for (const e of Object.values(p.exams)) if (e.passedAt) xp += XP.exam;
  return xp;
}
