import type { Step } from "../../content/types";
import { useUi } from "../../store/ui";

type LearnStep = Extract<Step, { kind: "learn" }>;

const minutes = (s: number) => `${Math.round(s / 60)} min`;

/** The video (when there is one) and the reading notes for the station. */
export function Learn({ step, onNext }: { step: LearnStep; onNext: () => void }) {
  const setChatOpen = useUi((s) => s.setChatOpen);
  return (
    <div className="step">
      <div className="video">
        {step.video.src ? (
          <video src={step.video.src} controls preload="metadata" />
        ) : (
          <div className="video__placeholder">
            <span className="video__play" aria-hidden="true">
              ▶
            </span>
            <span className="video__title">{step.video.title}</span>
            <span className="video__meta">{minutes(step.video.durationSec)} video, coming soon. The notes below cover the same ground.</span>
          </div>
        )}
      </div>

      {step.sections.map((s) => (
        <section key={s.heading} className="notes">
          <h3>{s.heading}</h3>
          <p>{s.body}</p>
          {s.code && (
            <pre>
              <code>{s.code}</code>
            </pre>
          )}
        </section>
      ))}

      <section className="keypoints">
        <h3>Key points</h3>
        <ul>
          {step.keyPoints.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </section>

      <div className="step__actions">
        <button className="btn" onClick={() => setChatOpen(true)}>
          Ask Ravi a question
        </button>
        <button className="btn btn--primary" onClick={onNext}>
          I&apos;m ready for the quiz
        </button>
      </div>
    </div>
  );
}
