import { interiorFor, lessonsFor } from "../content/lessons";
import { registerLabel } from "../engine/labelAnchors";
import { useProgress } from "../store/progress";
import { isCertified, isExamUnlocked, isLessonUnlocked } from "../store/progressRules";
import { useUi } from "../store/ui";
import { LockIcon } from "./LockIcon";
import { RaviBubble } from "./RaviBubble";

/** Floor labels for each station and the exam gate, plus Ravi's bubble. Positions come from <LabelProjector>. */
export function InteriorLabels({ moduleId }: { moduleId: string }) {
  const lessons = lessonsFor(moduleId);
  const ids = lessons.map((l) => l.id);
  const progress = useProgress();
  const hovered = useUi((s) => s.hoveredStationId);
  const interior = interiorFor(moduleId);
  const examOpen = isExamUnlocked(progress, ids);
  const examPassed = Boolean(progress.exams[moduleId]?.passedAt);

  return (
    <div className="labels" aria-hidden="true">
      {lessons.map((l) => {
        const open = isLessonUnlocked(progress, ids, l.id);
        const done = isCertified(progress, l.id);
        return (
          <div key={l.id} ref={registerLabel(l.id)} className={`labels__item ${hovered === l.id ? "is-top" : ""}`}>
            <div className={`sl ${done ? "sl--done" : open ? "sl--open" : "sl--locked"} ${hovered === l.id ? "sl--hover" : ""}`}>
              <span className="sl__num">{done ? "✓" : open ? l.slot : <LockIcon />}</span>
              <span className="sl__text">
                <span className="sl__title">{l.title}</span>
                {(hovered === l.id || open) && <span className="sl__topic">{l.topic}</span>}
              </span>
            </div>
          </div>
        );
      })}
      <div ref={registerLabel("exam")} className={`labels__item ${hovered === "exam" ? "is-top" : ""}`}>
        <div className={`sl ${examPassed ? "sl--done" : examOpen ? "sl--open" : "sl--locked"}`}>
          <span className="sl__num">{examPassed ? "✓" : examOpen ? "★" : <LockIcon />}</span>
          <span className="sl__text">
            <span className="sl__title">{interior?.examGate.label}</span>
            <span className="sl__topic">{examPassed ? "Passed · AI02 is boarding" : examOpen ? "Ready when you are" : "Opens after all 8 stations"}</span>
          </span>
        </div>
      </div>
      <div ref={registerLabel("model-city")} className="labels__item">
        <div className="sl sl--place">
          <span className="sl__text">
            <span className="sl__title">Model City</span>
            <span className="sl__topic">The model provider</span>
          </span>
        </div>
      </div>
      <div ref={registerLabel("ravi")} className="labels__item is-ravi">
        <RaviBubble moduleId={moduleId} />
      </div>
    </div>
  );
}
