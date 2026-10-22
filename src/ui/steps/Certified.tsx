import { XP } from "../../store/progressRules";

type Props = {
  stamp: string;
  upgrade: string;
  score: number | undefined;
  total: number;
  next: { title: string; slot: number } | null;
  onNext: () => void;
  onDone: () => void;
};

export function Certified({ stamp, upgrade, score, total, next, onNext, onDone }: Props) {
  return (
    <div className="step step--certified">
      <div className="stamp">
        <span className="stamp__ring">
          <span className="stamp__label">{stamp}</span>
          <span className="stamp__sub">Certified</span>
        </span>
      </div>
      <p className="certified__xp">
        +{XP.station + (score ?? 0) * XP.perCorrectCheck} XP · quiz {score ?? 0}/{total}
      </p>
      <p className="certified__upgrade">{upgrade}</p>
      <div className="step__actions">
        <button className="btn" onClick={onDone}>
          Back to the terminal
        </button>
        <button className="btn btn--primary" onClick={onNext}>
          {next ? `Next: Station ${next.slot}, ${next.title}` : "Go to the module exam"}
        </button>
      </div>
    </div>
  );
}
