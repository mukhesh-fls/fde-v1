import type { Question } from "../../content/types";

type Props = {
  question: Question;
  index?: number;
  chosen: number | undefined;
  onChoose?: (i: number) => void;
  /** Show right/wrong and the explanation. */
  reveal: boolean;
};

/** One multiple-choice question. Used by Predict, the station quiz and the module exam. */
export function QuestionCard({ question, index, chosen, onChoose, reveal }: Props) {
  const correct = chosen === question.answer;
  return (
    <div className="q">
      <p className="q__prompt">
        {index !== undefined && <span className="q__num">{index + 1}</span>}
        {question.prompt}
      </p>
      <div className="q__options" role="radiogroup">
        {question.options.map((opt, i) => {
          const state = reveal ? (i === question.answer ? "is-right" : i === chosen ? "is-wrong" : "") : i === chosen ? "is-chosen" : "";
          return (
            <button
              key={i}
              role="radio"
              aria-checked={i === chosen}
              className={`q__opt ${state}`}
              disabled={reveal || !onChoose}
              onClick={() => onChoose?.(i)}
            >
              <span className="q__letter">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          );
        })}
      </div>
      {reveal && chosen !== undefined && (
        <p className={`q__explain ${correct ? "is-right" : "is-wrong"}`}>
          <strong>{correct ? "Right. " : "Not quite. "}</strong>
          {question.explain}
        </p>
      )}
    </div>
  );
}
