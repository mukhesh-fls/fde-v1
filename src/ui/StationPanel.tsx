import { useState } from "react";
import { findLesson, lessonsFor } from "../content/lessons";
import { goBack } from "../engine/navigation";
import { useProgress } from "../store/progress";
import { useUi } from "../store/ui";
import { stepTodo } from "./RaviBubble";
import { Brief } from "./steps/Brief";
import { Certified } from "./steps/Certified";
import { Check } from "./steps/Check";
import { Learn } from "./steps/Learn";
import { Predict } from "./steps/Predict";

const stepLabel = { brief: "Brief", predict: "Predict", learn: "Learn", check: "Quiz", certified: "Stamp" } as const;

/** The right-hand panel for one station: step tabs and the current step. Mount with key={lessonId}. */
export function StationPanel({ lessonId }: { lessonId: string }) {
  const found = findLesson(lessonId)!;
  const { lesson, moduleId } = found;
  const lp = useProgress((s) => s.lessons[lessonId]);
  const { setStep, answerPredict, submitCheck, certify } = useProgress.getState();
  const openPanel = useUi((s) => s.openPanel);

  const certified = Boolean(lp?.certifiedAt);
  const reached = certified ? lesson.steps.length - 1 : (lp?.step ?? 0);
  const [cur, setCur] = useState(reached);

  const advance = () => {
    const next = Math.min(cur + 1, lesson.steps.length - 1);
    setStep(lessonId, Math.max(reached, next));
    if (lesson.steps[next].kind === "certified") certify(lessonId);
    setCur(next);
    document.querySelector(".panel__body")?.scrollTo({ top: 0 });
  };

  const lessons = lessonsFor(moduleId);
  const nextLesson = lessons.find((l) => l.slot === lesson.slot + 1) ?? null;
  const step = lesson.steps[cur];
  const checkStep = lesson.steps.find((s) => s.kind === "check");
  const quizTotal = checkStep?.kind === "check" ? checkStep.questions.length : 0;

  return (
    <aside className="panel" aria-label={`Station ${lesson.slot}: ${lesson.title}`}>
      <header className="panel__head">
        <div className="panel__eyebrow">
          Station {lesson.slot} of {lessons.length}
          {certified && <span className="pill pill--boarding">Certified</span>}
        </div>
        <h2 className="panel__title">{lesson.title}</h2>
        <p className="panel__topic">{lesson.topic}</p>
        <button className="panel__close" onClick={() => void goBack()} aria-label="Close station (Esc)">
          ×
        </button>
        <nav className="steps-nav">
          {lesson.steps.map((s, i) => (
            <button
              key={i}
              className={`steps-nav__item ${i === cur ? "is-current" : ""} ${i < reached || certified ? "is-done" : ""}`}
              disabled={i > reached}
              title={stepTodo[s.kind]}
              onClick={() => setCur(i)}
            >
              <span className="steps-nav__dot">{i < reached || certified ? "✓" : i + 1}</span>
              {stepLabel[s.kind]}
            </button>
          ))}
        </nav>
      </header>
      <div className="panel__body">
        {step.kind === "brief" && <Brief lines={step.mentor} onNext={advance} />}
        {step.kind === "predict" && (
          <Predict question={step.question} chosen={lp?.predictAnswer} onChoose={(i) => answerPredict(lessonId, i)} onNext={advance} />
        )}
        {step.kind === "learn" && <Learn step={step} onNext={advance} />}
        {step.kind === "check" &&
          (cur < reached || certified ? (
            <div className="step">
              <div className="result result--pass">
                <strong>Passed with {lp?.checkScore ?? 0} of {step.questions.length}.</strong> You can retake it any time below.
              </div>
              <Check key="retake" questions={step.questions} passMark={step.passMark} onSubmit={(a, s) => submitCheck(lessonId, a, s)} onPassed={() => setCur(cur + 1)} />
            </div>
          ) : (
            <Check key={lessonId} questions={step.questions} passMark={step.passMark} onSubmit={(a, s) => submitCheck(lessonId, a, s)} onPassed={advance} />
          ))}
        {step.kind === "certified" && (
          <Certified
            stamp={step.stamp}
            upgrade={step.upgrade}
            score={lp?.checkScore}
            total={quizTotal}
            next={nextLesson ? { title: nextLesson.title, slot: nextLesson.slot } : null}
            onNext={() => openPanel(nextLesson ? { kind: "lesson", lessonId: nextLesson.id } : { kind: "exam", moduleId })}
            onDone={() => void goBack()}
          />
        )}
      </div>
    </aside>
  );
}
