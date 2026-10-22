import { useState } from "react";
import { examFor } from "../content/lessons";
import { modules } from "../content/modules";
import { goBack } from "../engine/navigation";
import { useProgress } from "../store/progress";
import { examPassed, scoreAnswers } from "../store/progressRules";
import { QuestionCard } from "./steps/QuestionCard";

/** The module exam at the departure gate. Passing opens the gate and starts boarding the next module. */
export function ExamPanel({ moduleId }: { moduleId: string }) {
  const exam = examFor(moduleId)!;
  const record = useProgress((s) => s.exams[moduleId]);
  const submitExam = useProgress((s) => s.submitExam);
  const [answers, setAnswers] = useState<(number | undefined)[]>(() => exam.questions.map(() => undefined));
  const [submitted, setSubmitted] = useState(false);

  const answered = answers.filter((a) => a !== undefined).length;
  const correct = scoreAnswers(exam.questions, answers as number[]);
  const passed = examPassed(exam, correct);
  const needed = Math.ceil(exam.passMark * exam.questions.length);
  const nextModule = modules[modules.findIndex((m) => m.id === moduleId) + 1];

  const submit = () => {
    setSubmitted(true);
    submitExam(moduleId, answers as number[], correct / exam.questions.length, passed);
    document.querySelector(".panel__body")?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const retry = () => {
    setAnswers(exam.questions.map(() => undefined));
    setSubmitted(false);
  };

  return (
    <aside className="panel" aria-label={exam.title}>
      <header className="panel__head">
        <div className="panel__eyebrow">
          Departure gate
          {record?.passedAt && <span className="pill pill--boarding">Passed</span>}
        </div>
        <h2 className="panel__title">{exam.title}</h2>
        <p className="panel__topic">
          {exam.questions.length} questions across all eight stations. Get {needed} right to open the gate
          {nextModule ? ` to ${nextModule.code}` : ""}.
        </p>
        <button className="panel__close" onClick={() => void goBack()} aria-label="Close exam (Esc)">
          ×
        </button>
        {!submitted && (
          <div className="progressbar" aria-label={`${answered} of ${exam.questions.length} answered`}>
            <span style={{ width: `${(answered / exam.questions.length) * 100}%` }} />
          </div>
        )}
      </header>
      <div className="panel__body">
        <div className="step">
          {submitted && (
            <div className={`result ${passed ? "result--pass" : "result--fail"}`}>
              <strong>
                {correct} of {exam.questions.length} correct ({Math.round((correct / exam.questions.length) * 100)}%).
              </strong>{" "}
              {passed
                ? `The gate is open. ${nextModule ? `${nextModule.code} ${nextModule.building.name} is now boarding.` : ""}`
                : `You need ${needed}. The explanations below show what to revisit.`}
            </div>
          )}
          {exam.questions.map((q, i) => (
            <QuestionCard
              key={i}
              index={i}
              question={q}
              chosen={answers[i]}
              reveal={submitted}
              onChoose={(c) => setAnswers((prev) => prev.map((a, j) => (j === i ? c : a)))}
            />
          ))}
          <div className="step__actions">
            {!submitted && (
              <button className="btn btn--primary" disabled={answered < exam.questions.length} onClick={submit}>
                {answered < exam.questions.length ? `Answer all questions (${answered}/${exam.questions.length})` : "Submit exam"}
              </button>
            )}
            {submitted && !passed && (
              <button className="btn btn--primary" onClick={retry}>
                Try again
              </button>
            )}
            {submitted && passed && (
              <button
                className="btn btn--primary"
                onClick={async () => {
                  await goBack();
                  await goBack();
                }}
              >
                Go outside and see {nextModule?.code ?? "the airport"}
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
