import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LessonProgress, ProgressData } from "./progressRules";
import { emptyProgress } from "./progressRules";

type ProgressState = ProgressData & {
  setStep: (lessonId: string, step: number) => void;
  answerPredict: (lessonId: string, answer: number) => void;
  submitCheck: (lessonId: string, answers: number[], score: number) => void;
  certify: (lessonId: string) => void;
  submitExam: (moduleId: string, answers: number[], score: number, passed: boolean) => void;
  reset: () => void;
};

const now = () => new Date().toISOString();

function patchLesson(s: ProgressData, id: string, patch: Partial<LessonProgress>) {
  const prev = s.lessons[id] ?? { step: 0 };
  return { lessons: { ...s.lessons, [id]: { ...prev, ...patch } } };
}

/** The learner's progress, saved in local storage (Supabase later, see docs/04-engine.md). */
export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      ...emptyProgress(),
      setStep: (id, step) =>
        set((s) => patchLesson(s, id, { step: Math.max(step, 0) })),
      answerPredict: (id, answer) => set((s) => patchLesson(s, id, { predictAnswer: answer })),
      submitCheck: (id, answers, score) =>
        set((s) => {
          const prev = s.lessons[id];
          return patchLesson(s, id, {
            checkAnswers: answers,
            checkScore: Math.max(score, prev?.checkScore ?? 0),
            attempts: (prev?.attempts ?? 0) + 1,
          });
        }),
      certify: (id) => set((s) => (s.lessons[id]?.certifiedAt ? s : patchLesson(s, id, { certifiedAt: now() }))),
      submitExam: (moduleId, answers, score, passed) =>
        set((s) => {
          const prev = s.exams[moduleId];
          return {
            exams: {
              ...s.exams,
              [moduleId]: {
                attempts: (prev?.attempts ?? 0) + 1,
                bestScore: Math.max(score, prev?.bestScore ?? 0),
                lastAnswers: answers,
                passedAt: prev?.passedAt ?? (passed ? now() : undefined),
              },
            },
          };
        }),
      reset: () => set(emptyProgress()),
    }),
    { name: "ais-progress-v1", storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
