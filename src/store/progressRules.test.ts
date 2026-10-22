import { describe, expect, it } from "vitest";
import type { ExamDef } from "../content/types";
import {
  emptyProgress,
  examPassed,
  isExamUnlocked,
  isLessonUnlocked,
  moduleStatus,
  nextLessonId,
  scoreAnswers,
  totalXp,
} from "./progressRules";

const ids = ["s1", "s2", "s3"];
const done = (...certified: string[]) => {
  const p = emptyProgress();
  for (const id of certified) p.lessons[id] = { step: 4, certifiedAt: "2026-10-20", checkScore: 3 };
  return p;
};

describe("station unlocking", () => {
  it("opens only the first station at the start", () => {
    const p = emptyProgress();
    expect(ids.map((id) => isLessonUnlocked(p, ids, id))).toEqual([true, false, false]);
    expect(nextLessonId(p, ids)).toBe("s1");
  });

  it("opens the next station when the previous one is certified", () => {
    const p = done("s1");
    expect(ids.map((id) => isLessonUnlocked(p, ids, id))).toEqual([true, true, false]);
    expect(nextLessonId(p, ids)).toBe("s2");
  });

  it("opens the exam only after every station is certified", () => {
    expect(isExamUnlocked(done("s1", "s2"), ids)).toBe(false);
    expect(isExamUnlocked(done("s1", "s2", "s3"), ids)).toBe(true);
  });
});

describe("scoring", () => {
  const exam: ExamDef = {
    moduleId: "m01",
    title: "t",
    passMark: 0.7,
    questions: Array.from({ length: 10 }, () => ({ prompt: "q", options: ["a", "b"], answer: 1, explain: "" })),
  };

  it("counts correct answers", () => {
    expect(scoreAnswers(exam.questions.slice(0, 3), [1, 0, 1])).toBe(2);
  });

  it("passes the exam at the pass mark and not below", () => {
    expect(examPassed(exam, 7)).toBe(true);
    expect(examPassed(exam, 6)).toBe(false);
  });

  it("adds XP for stations, quiz answers and exams", () => {
    const p = done("s1");
    p.exams.m01 = { attempts: 1, bestScore: 0.8, passedAt: "x" };
    expect(totalXp(p)).toBe(100 + 30 + 300);
  });
});

describe("module status", () => {
  const mods = ["m01", "m02", "m03"];
  it("boards the first module and schedules the rest", () => {
    expect(mods.map((m) => moduleStatus(emptyProgress(), mods, m))).toEqual(["boarding", "scheduled", "scheduled"]);
  });
  it("completes a module and boards the next when its exam is passed", () => {
    const p = emptyProgress();
    p.exams.m01 = { attempts: 1, bestScore: 0.9, passedAt: "x" };
    expect(mods.map((m) => moduleStatus(p, mods, m))).toEqual(["completed", "boarding", "scheduled"]);
  });
});
