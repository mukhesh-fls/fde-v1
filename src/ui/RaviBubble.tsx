import { lessonsFor } from "../content/lessons";
import type { StepKind } from "../content/types";
import { useProgress } from "../store/progress";
import { isExamUnlocked, nextLessonId } from "../store/progressRules";
import { useUi } from "../store/ui";

export const stepTodo: Record<StepKind, string> = {
  brief: "Hear the situation",
  predict: "Predict what happens",
  learn: "Watch and read the lesson",
  check: "Pass the quiz",
  certified: "Get your stamp",
};

/** Ravi's thought bubble: what to do next, as a short checklist. */
export function RaviBubble({ moduleId }: { moduleId: string }) {
  const line = useUi((s) => s.ravisLine);
  const panel = useUi((s) => s.panel);
  const progress = useProgress();
  const lessons = lessonsFor(moduleId);
  const ids = lessons.map((l) => l.id);

  let title: string;
  let items: { text: string; done: boolean; current: boolean }[] = [];
  let note: string | null = null;

  if (panel?.kind === "lesson") {
    const lesson = lessons.find((l) => l.id === panel.lessonId)!;
    const lp = progress.lessons[lesson.id];
    const step = lp?.certifiedAt ? lesson.steps.length : (lp?.step ?? 0);
    title = `Station ${lesson.slot} · your to-do`;
    items = lesson.steps.map((s, i) => ({ text: stepTodo[s.kind], done: i < step, current: i === step }));
  } else if (panel?.kind === "exam") {
    title = "Module exam";
    note = "Answer all questions. You need 70% to open the gate to AI02. Take your time.";
  } else {
    const next = nextLessonId(progress, ids);
    const nextLesson = lessons.find((l) => l.id === next);
    const passed = progress.exams[moduleId]?.passedAt;
    title = "Ravi";
    if (passed) note = "Terminal 1 is done. AI02 is boarding. Press Esc to go back outside.";
    else if (nextLesson)
      note = `${next === ids[0] ? "Welcome to Terminal 1. " : ""}Next: Station ${nextLesson.slot}, ${nextLesson.title}. Click it to start.`;
    else if (isExamUnlocked(progress, ids)) note = "All eight stations done. Take the module exam at the departure gate.";
    else note = null;
  }

  return (
    <div className="ravi">
      {line ? (
        <p className="ravi__line">{line}</p>
      ) : (
        <>
          <div className="ravi__title">{title}</div>
          {note && <p className="ravi__note">{note}</p>}
          {items.length > 0 && (
            <ul className="ravi__list">
              {items.map((it, i) => (
                <li key={i} className={it.done ? "is-done" : it.current ? "is-current" : ""}>
                  <span className="ravi__tick">{it.done ? "✓" : i + 1}</span>
                  {it.text}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
