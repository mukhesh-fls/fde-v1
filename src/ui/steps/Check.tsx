import { useState } from "react";
import type { Question } from "../../content/types";
import { scoreAnswers } from "../../store/progressRules";
import { useUi } from "../../store/ui";
import { QuestionCard } from "./QuestionCard";

type Props = {
  questions: Question[];
  passMark: number;
  onSubmit: (answers: number[], score: number) => void;
  onPassed: () => void;
};

/** The station quiz. Pass to certify the station; otherwise review the explanations and try again. */
export function Check({ questions, passMark, onSubmit, onPassed }: Props) {
  const [answers, setAnswers] = useState<(number | undefined)[]>(() => questions.map(() => undefined));
  const [submitted, setSubmitted] = useState(false);
  const say = useUi((s) => s.say);
  const all = answers.every((a) => a !== undefined);
  const score = scoreAnswers(questions, answers as number[]);
  const passed = score >= passMark;

  const submit = () => {
    setSubmitted(true);
    onSubmit(answers as number[], score);
    const firstWrong = questions.find((q, i) => answers[i] !== q.answer);
    if (firstWrong) say(firstWrong.explain);
  };
  const retry = () => {
    setAnswers(questions.map(() => undefined));
    setSubmitted(false);
    say(null);
  };

  return (
    <div className="step">
      <p className="step__lead">
        {questions.length} questions. Get {passMark} right to certify this station.
      </p>
      {questions.map((q, i) => (
        <QuestionCard
          key={i}
          index={i}
          question={q}
          chosen={answers[i]}
          reveal={submitted}
          onChoose={(c) => setAnswers((prev) => prev.map((a, j) => (j === i ? c : a)))}
        />
      ))}
      {submitted && (
        <div className={`result ${passed ? "result--pass" : "result--fail"}`}>
          <strong>
            {score} of {questions.length} correct.
          </strong>{" "}
          {passed ? "Station certified." : `You need ${passMark}. Read the explanations above, then try again.`}
        </div>
      )}
      <div className="step__actions">
        {!submitted && (
          <button className="btn btn--primary" disabled={!all} onClick={submit}>
            Submit answers
          </button>
        )}
        {submitted && !passed && (
          <button className="btn btn--primary" onClick={retry}>
            Try again
          </button>
        )}
        {submitted && passed && (
          <button className="btn btn--primary" onClick={onPassed}>
            Collect your stamp
          </button>
        )}
      </div>
    </div>
  );
}
