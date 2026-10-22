import type { Question } from "../../content/types";
import { QuestionCard } from "./QuestionCard";

type Props = { question: Question; chosen: number | undefined; onChoose: (i: number) => void; onNext: () => void };

/** Guess before learning. Any answer is fine; the point is to commit to one. */
export function Predict({ question, chosen, onChoose, onNext }: Props) {
  return (
    <div className="step">
      <p className="step__lead">Before you learn anything, make a guess. Wrong guesses are fine. They make the lesson stick.</p>
      <QuestionCard question={question} chosen={chosen} onChoose={chosen === undefined ? onChoose : undefined} reveal={chosen !== undefined} />
      <div className="step__actions">
        <button className="btn btn--primary" disabled={chosen === undefined} onClick={onNext}>
          Continue to the lesson
        </button>
      </div>
    </div>
  );
}
