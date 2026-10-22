import { useState } from "react";
import { useProgress } from "../../store/progress";
import { scoreAnswers } from "../../store/progressRules";
import { QuestionCard } from "../../ui/steps/QuestionCard";
import { findLabLesson, type LabLesson } from "../content";
import { LAB_MODELS } from "../registry";
import { useLab, type LabSheet } from "../store";

const TABS: { id: Exclude<LabSheet, null>; label: string }[] = [
  { id: "walkthrough", label: "Walkthrough" },
  { id: "details", label: "Details" },
  { id: "read", label: "Read" },
  { id: "quiz", label: "Quiz" },
];

/** The side sheet: the full walkthrough, the model's detailed readouts, the reading and the quiz. Closed by default. */
export function LabPanel() {
  const lessonId = useLab((s) => s.lessonId);
  const sheet = useLab((s) => s.sheet);
  const setSheet = useLab((s) => s.setSheet);
  const lesson = findLabLesson(lessonId)!;
  if (!sheet) return null;
  return (
    <aside className="sheet" aria-label={`Episode ${lesson.episode}: ${lesson.title}`}>
      <header className="sheet__head">
        <div className="panel__eyebrow">Episode {lesson.episode}</div>
        <h2 className="panel__title">{lesson.title}</h2>
        <p className="panel__topic">{lesson.tagline}</p>
        <button className="panel__close" onClick={() => setSheet(null)} aria-label="Close">
          ×
        </button>
        <nav className="seg seg--full" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={sheet === t.id} className={sheet === t.id ? "is-on" : ""} onClick={() => setSheet(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <div className="panel__body">
        {sheet === "walkthrough" && <Walkthrough lesson={lesson} />}
        {sheet === "details" && <Details />}
        {sheet === "read" && <ReadTab lesson={lesson} />}
        {sheet === "quiz" && <QuizTab key={lessonId} lesson={lesson} />}
      </div>
    </aside>
  );
}

function Walkthrough({ lesson }: { lesson: LabLesson }) {
  const modelId = useLab((s) => s.tab.modelId);
  const stageId = useLab((s) => s.stageId);
  const setStage = useLab((s) => s.setStage);
  const model = lesson.models.find((m) => m.id === modelId)!;
  return (
    <div className="step">
      <p className="step__lead">{model.intro}</p>
      <ol className="flow__list">
        {model.stages.map((s, i) => (
          <li key={s.id} className={s.id === stageId ? "is-current" : ""}>
            <button onClick={() => setStage(s.id === stageId ? null : s.id)}>
              <span className="flow__num">{i + 1}</span>
              <span className="flow__title">{s.title}</span>
            </button>
            {s.id === stageId && <p>{s.body}</p>}
          </li>
        ))}
      </ol>
      <section className="keypoints">
        <h3>Try this</h3>
        <ul>
          {model.tryThis.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** The same controls component, shown with its tables and lists instead of its inputs. */
function Details() {
  const modelId = useLab((s) => s.tab.modelId);
  const def = LAB_MODELS[modelId];
  return <div className="step details">{def && <def.Controls />}</div>;
}

function ReadTab({ lesson }: { lesson: LabLesson }) {
  return (
    <div className="step">
      {lesson.sections.map((s) => (
        <section key={s.heading} className="notes">
          <h3>{s.heading}</h3>
          <p>{s.body}</p>
        </section>
      ))}
      <section className="notes notes--lens">
        <h3>Systems lens</h3>
        <p>{lesson.systemsLens}</p>
      </section>
      <section className="keypoints">
        <h3>Remember</h3>
        <ul>
          {lesson.remember.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function QuizTab({ lesson }: { lesson: LabLesson }) {
  const [answers, setAnswers] = useState<(number | undefined)[]>(() => lesson.quiz.map(() => undefined));
  const [submitted, setSubmitted] = useState(false);
  const { submitCheck, certify, setStep } = useProgress.getState();
  const passMark = Math.ceil(lesson.quiz.length * 0.66);
  const score = scoreAnswers(lesson.quiz, answers as number[]);
  const passed = score >= passMark;
  return (
    <div className="step">
      <p className="step__lead">
        {lesson.quiz.length} questions. Get {passMark} right to finish this episode.
      </p>
      {lesson.quiz.map((q, i) => (
        <QuestionCard key={i} index={i} question={q} chosen={answers[i]} reveal={submitted} onChoose={(c) => setAnswers((p) => p.map((a, j) => (j === i ? c : a)))} />
      ))}
      {submitted && (
        <div className={`result ${passed ? "result--pass" : "result--fail"}`}>
          <strong>
            {score} of {lesson.quiz.length} correct.
          </strong>{" "}
          {passed ? "Episode done." : "Read the explanations, try the models again, then retry."}
        </div>
      )}
      <div className="step__actions">
        {!submitted ? (
          <button
            className="btn btn--primary"
            disabled={answers.some((a) => a === undefined)}
            onClick={() => {
              setSubmitted(true);
              submitCheck(lesson.id, answers as number[], score);
              if (score >= passMark) {
                setStep(lesson.id, 1);
                certify(lesson.id);
              }
            }}
          >
            Submit answers
          </button>
        ) : (
          <button
            className="btn btn--primary"
            onClick={() => {
              setAnswers(lesson.quiz.map(() => undefined));
              setSubmitted(false);
            }}
          >
            {passed ? "Retake" : "Try again"}
          </button>
        )}
      </div>
    </div>
  );
}
