import { describe, expect, it } from "vitest";
import { examFor, interiorFor, lessonsFor } from "./lessons";

describe("Module 01 content", () => {
  const lessons = lessonsFor("m01");
  const interior = interiorFor("m01")!;
  const exam = examFor("m01")!;

  it("has eight lessons in slot order, each placed in the terminal", () => {
    expect(lessons.map((l) => l.slot)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const l of lessons) expect(interior.stations[l.id], l.id).toBeDefined();
  });

  it("every lesson runs brief, predict, learn, check, certified", () => {
    for (const l of lessons) expect(l.steps.map((s) => s.kind)).toEqual(["brief", "predict", "learn", "check", "certified"]);
  });

  it("every question has a valid answer and an explanation", () => {
    const all = [
      ...lessons.flatMap((l) => l.steps.flatMap((s) => (s.kind === "check" ? s.questions : s.kind === "predict" ? [s.question] : []))),
      ...lessons.flatMap((l) => l.review),
      ...exam.questions,
    ];
    for (const q of all) {
      expect(q.answer, q.prompt).toBeGreaterThanOrEqual(0);
      expect(q.answer, q.prompt).toBeLessThan(q.options.length);
      expect(q.explain.length, q.prompt).toBeGreaterThan(10);
    }
  });

  it("the quiz pass mark is reachable and the exam needs 70%", () => {
    for (const l of lessons)
      for (const s of l.steps) if (s.kind === "check") expect(s.passMark).toBeLessThanOrEqual(s.questions.length);
    expect(exam.passMark).toBe(0.7);
    expect(exam.questions.length).toBeGreaterThanOrEqual(10);
  });
});
