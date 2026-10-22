import { examFor, lessonsFor } from "../content/lessons";
import { modules } from "../content/modules";
import { useProgress } from "../store/progress";
import { isCertified, isExamUnlocked, isLessonUnlocked } from "../store/progressRules";
import { useUi } from "../store/ui";
import { LockIcon } from "./LockIcon";

/** Inside a building: every lesson in order, plus the module exam. The same choices as clicking in 3D. */
export function LessonList({ moduleId }: { moduleId: string }) {
  const m = modules.find((x) => x.id === moduleId)!;
  const lessons = lessonsFor(moduleId);
  const ids = lessons.map((l) => l.id);
  const progress = useProgress();
  const panel = useUi((s) => s.panel);
  const { openPanel, say, setHoveredStation } = useUi.getState();
  const examOpen = isExamUnlocked(progress, ids);
  const examPassed = Boolean(progress.exams[moduleId]?.passedAt);
  const done = ids.filter((id) => isCertified(progress, id)).length;

  return (
    <section className="lessons" aria-label={`${m.building.name} lessons`}>
      <header className="lessons__head">
        <div className="lessons__eyebrow">
          {m.code} · {m.building.name}
        </div>
        <div className="lessons__title">{m.title}</div>
        <div className="progressbar">
          <span style={{ width: `${(done / ids.length) * 100}%` }} />
        </div>
        <div className="lessons__meta">
          {done} of {ids.length} stations certified
        </div>
      </header>
      <ol className="lessons__list">
        {lessons.map((l) => {
          const open = isLessonUnlocked(progress, ids, l.id);
          const cert = isCertified(progress, l.id);
          const active = panel?.kind === "lesson" && panel.lessonId === l.id;
          return (
            <li key={l.id}>
              <button
                className={`lessons__item ${active ? "is-active" : ""} ${cert ? "is-done" : open ? "is-open" : "is-locked"}`}
                onMouseEnter={() => setHoveredStation(l.id)}
                onMouseLeave={() => setHoveredStation(null)}
                onClick={() =>
                  open ? openPanel({ kind: "lesson", lessonId: l.id }) : say(`Station ${l.slot} opens when you finish Station ${l.slot - 1}.`)
                }
              >
                <span className="lessons__num">{cert ? "✓" : open ? l.slot : <LockIcon />}</span>
                <span className="lessons__text">
                  <span className="lessons__name">{l.title}</span>
                  <span className="lessons__topic">{l.topic}</span>
                </span>
              </button>
            </li>
          );
        })}
        {examFor(moduleId) && (
          <li>
            <button
              className={`lessons__item lessons__item--exam ${examPassed ? "is-done" : examOpen ? "is-open" : "is-locked"} ${panel?.kind === "exam" ? "is-active" : ""}`}
              onMouseEnter={() => setHoveredStation("exam")}
              onMouseLeave={() => setHoveredStation(null)}
              onClick={() =>
                examOpen ? openPanel({ kind: "exam", moduleId }) : say("The module exam opens when all eight stations are certified.")
              }
            >
              <span className="lessons__num">{examPassed ? "✓" : examOpen ? "★" : <LockIcon />}</span>
              <span className="lessons__text">
                <span className="lessons__name">Module exam</span>
                <span className="lessons__topic">{examPassed ? "Passed. The gate is open." : "Pass it to open the next gate"}</span>
              </span>
            </button>
          </li>
        )}
      </ol>
    </section>
  );
}
