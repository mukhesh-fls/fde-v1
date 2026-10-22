import { useState } from "react";
import { examFor, lessonsFor } from "../content/lessons";
import { modules } from "../content/modules";
import { labLessons, labModule } from "../lab/content";
import { useProgress } from "../store/progress";
import { totalXp } from "../store/progressRules";
import { useUi } from "../store/ui";

/** Scoreboard: XP, stations, quiz scores and exam results, saved in this browser. */
export function Scoreboard() {
  const progress = useProgress();
  const openPanel = useUi((s) => s.openPanel);
  const withLessons = modules.filter((m) => lessonsFor(m.id).length > 0);

  const allLessons = withLessons.flatMap((m) => lessonsFor(m.id));
  const certified = allLessons.filter((l) => progress.lessons[l.id]?.certifiedAt).length;
  const quizzes = allLessons.map((l) => progress.lessons[l.id]?.checkScore).filter((s): s is number => s !== undefined);
  const quizAvg = quizzes.length ? Math.round((quizzes.reduce((a, b) => a + b, 0) / (quizzes.length * 3)) * 100) : null;

  // Two-step reset in the page itself: browser confirm() dialogs are blocked when embedded.
  const [confirming, setConfirming] = useState(false);

  return (
    <aside className="panel" aria-label="Scoreboard">
      <header className="panel__head">
        <div className="panel__eyebrow">Your progress</div>
        <h2 className="panel__title">Scoreboard</h2>
        <button className="panel__close" onClick={() => openPanel(null)} aria-label="Close scoreboard">
          ×
        </button>
      </header>
      <div className="panel__body">
        <div className="stats">
          <div className="stat">
            <span className="stat__value">{totalXp(progress)}</span>
            <span className="stat__label">XP</span>
          </div>
          <div className="stat">
            <span className="stat__value">
              {certified}/{allLessons.length}
            </span>
            <span className="stat__label">Stations certified</span>
          </div>
          <div className="stat">
            <span className="stat__value">{quizAvg === null ? "–" : `${quizAvg}%`}</span>
            <span className="stat__label">Quiz average</span>
          </div>
        </div>

        {withLessons.map((m) => {
          const exam = progress.exams[m.id];
          const examDef = examFor(m.id);
          return (
            <section key={m.id} className="sb-module">
              <h3>
                <span className="board__code">{m.code}</span> {m.title}
              </h3>
              <table className="sb-table">
                <thead>
                  <tr>
                    <th>Station</th>
                    <th>Quiz</th>
                    <th>Tries</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lessonsFor(m.id).map((l) => {
                    const lp = progress.lessons[l.id];
                    return (
                      <tr key={l.id}>
                        <td>
                          {l.slot}. {l.title}
                        </td>
                        <td>{lp?.checkScore !== undefined ? `${lp.checkScore}/3` : "–"}</td>
                        <td>{lp?.attempts ?? 0}</td>
                        <td>
                          {lp?.certifiedAt ? (
                            <span className="pill pill--boarding">Certified</span>
                          ) : lp?.step ? (
                            <span className="pill pill--delayed">In progress</span>
                          ) : (
                            <span className="pill">Not started</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {examDef && (
                    <tr className="sb-exam">
                      <td>Module exam</td>
                      <td>{exam ? `${Math.round(exam.bestScore * 100)}%` : "–"}</td>
                      <td>{exam?.attempts ?? 0}</td>
                      <td>
                        {exam?.passedAt ? (
                          <span className="pill pill--boarding">Passed</span>
                        ) : (
                          <span className="pill">{exam ? "Not passed yet" : "Locked"}</span>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          );
        })}
        <section className="sb-module">
          <h3>
            <span className="board__code">LAB</span> AI Systems Lab · {labModule.level}
          </h3>
          <table className="sb-table">
            <thead>
              <tr>
                <th>Episode</th>
                <th>Quiz</th>
                <th>Tries</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {labLessons.map((l) => {
                const lp = progress.lessons[l.id];
                return (
                  <tr key={l.id}>
                    <td>
                      {l.episode}. {l.title}
                    </td>
                    <td>{lp?.checkScore !== undefined ? `${lp.checkScore}/${l.quiz.length}` : "–"}</td>
                    <td>{lp?.attempts ?? 0}</td>
                    <td>{lp?.certifiedAt ? <span className="pill pill--boarding">Done</span> : <span className="pill">Not done</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
        <p className="sb-note">Progress is saved in this browser. Accounts and a shared leaderboard come later.</p>
        {confirming ? (
          <div className="sb-confirm">
            <span>Reset all progress in this browser? This can&apos;t be undone.</span>
            <button className="btn" onClick={() => setConfirming(false)}>
              Keep it
            </button>
            <button
              className="btn btn--danger"
              onClick={() => {
                progress.reset();
                setConfirming(false);
              }}
            >
              Reset
            </button>
          </div>
        ) : (
          <button className="btn btn--quiet" onClick={() => setConfirming(true)}>
            Reset progress
          </button>
        )}
      </div>
    </aside>
  );
}
