import { useLayoutEffect, useRef } from "react";
import { frame, setViewOffset, zoomBy } from "../../engine/cameraRig";
import { goBack } from "../../engine/navigation";
import { useProgress } from "../../store/progress";
import { findLabLesson, labLessons, labModule } from "../content";
import { LAB_MODELS } from "../registry";
import { useLab } from "../store";

/** Top of the lab: breadcrumb with the episode picker on the left, the episode's models and the side sheet on the right. */
export function LabTopBar() {
  const lessonId = useLab((s) => s.lessonId);
  const tab = useLab((s) => s.tab);
  const sheet = useLab((s) => s.sheet);
  const episodesOpen = useLab((s) => s.episodesOpen);
  const { setTab, setSheet, setEpisodesOpen, openLesson } = useLab.getState();
  const lesson = findLabLesson(lessonId)!;
  const progress = useProgress((s) => s.lessons);

  return (
    <header className="lab-top">
      <nav className="lab-crumbs" aria-label="Where you are">
        <button className="lab-crumbs__link" onClick={() => void goBack()} title="Back to the airport (Esc)">
          Futurelab
        </button>
        <span aria-hidden="true">/</span>
        <span className="lab-crumbs__plain">AI Systems Lab</span>
        <span aria-hidden="true">/</span>
        <div className="lab-episodes">
          <button className="lab-crumbs__current" aria-expanded={episodesOpen} onClick={() => setEpisodesOpen(!episodesOpen)}>
            Episode {lesson.episode} · {lesson.title} <span aria-hidden="true">▾</span>
          </button>
          {episodesOpen && (
            <div className="lab-episodes__menu" role="menu">
              <div className="lab-episodes__head">{labModule.level}</div>
              {labLessons.map((l) => (
                <button key={l.id} role="menuitem" className={`lab-episodes__item ${l.id === lessonId ? "is-current" : ""}`} onClick={() => openLesson(l.id)}>
                  <span className={`lab-episodes__num ${progress[l.id]?.certifiedAt ? "is-done" : ""}`}>{progress[l.id]?.certifiedAt ? "✓" : l.episode}</span>
                  <span>
                    <span className="lab-episodes__title">{l.title}</span>
                    <span className="lab-episodes__sub">{l.models.map((m) => m.title).join(" · ")}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
      <div className="lab-top__right">
        <div className="seg" role="tablist" aria-label="Models in this episode">
          {lesson.models.map((m) => (
            <button key={m.id} role="tab" aria-selected={tab.modelId === m.id} className={tab.modelId === m.id ? "is-on" : ""} onClick={() => setTab({ kind: "model", modelId: m.id })}>
              {m.title}
            </button>
          ))}
        </div>
        <button className={`lab-pill ${sheet && sheet !== "quiz" ? "is-on" : ""}`} onClick={() => setSheet(sheet && sheet !== "quiz" ? null : "walkthrough")}>
          Learn
        </button>
        <button className={`lab-pill ${sheet === "quiz" ? "is-on" : ""} ${progress[lessonId]?.certifiedAt ? "is-done" : ""}`} onClick={() => setSheet(sheet === "quiz" ? null : "quiz")}>
          {progress[lessonId]?.certifiedAt ? "Quiz ✓" : "Quiz"}
        </button>
      </div>
    </header>
  );
}

/** The frosted control dock: the walkthrough stepper, the model's controls, and a one-line caption. */
export function LabDock() {
  const lessonId = useLab((s) => s.lessonId);
  const modelId = useLab((s) => s.tab.modelId);
  const stageId = useLab((s) => s.stageId);
  const setStage = useLab((s) => s.setStage);
  const model = findLabLesson(lessonId)?.models.find((m) => m.id === modelId);
  const def = LAB_MODELS[modelId];
  const ref = useRef<HTMLElement>(null);
  // Publish the dock's height so the tip, chat and sheet sit just above it.
  useLayoutEffect(() => {
    const el = ref.current;
    const app = el?.closest(".app") as HTMLElement | null;
    if (!el || !app) return;
    const ro = new ResizeObserver(() => app.style.setProperty("--dock-h", `${Math.round(el.offsetHeight)}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, [modelId]);
  if (!model || !def) return null;
  const idx = model.stages.findIndex((s) => s.id === stageId);
  const stage = idx >= 0 ? model.stages[idx] : null;
  const go = (i: number) => setStage(i < 0 || i >= model.stages.length ? null : model.stages[i].id);

  return (
    <section ref={ref} className="dock" aria-label={`${model.title} controls`}>
      <div className="dock__walk">
        <div className="dock__walk-head">
          <span className="dock__eyebrow">How it works</span>
          <span className="dock__count">{stage ? `${idx + 1} of ${model.stages.length}` : `${model.stages.length} steps`}</span>
        </div>
        <div className="dock__walk-title">{stage ? stage.title : model.title}</div>
        <div className="dock__walk-nav">
          <button className="dock__arrow" onClick={() => go(idx - 1)} disabled={idx <= 0} aria-label="Previous step">
            ‹
          </button>
          <button className="dock__start" onClick={() => go(idx + 1)}>
            {idx < 0 ? "Start the walkthrough" : idx === model.stages.length - 1 ? "Finish" : "Next step"}
          </button>
        </div>
      </div>
      <div className="dock__controls">
        <def.Controls />
      </div>
      <p className="dock__caption">{stage ? stage.body : model.intro}</p>
      <p className="dock__fine">Teaching model · drag to orbit · scroll to zoom · click anything for an explanation</p>
    </section>
  );
}

/** Ravi's tip, docked in the corner so it never covers the model. */
export function RaviTip() {
  const lessonId = useLab((s) => s.lessonId);
  const modelId = useLab((s) => s.tab.modelId);
  const tipIndex = useLab((s) => s.tipIndex);
  const tipOpen = useLab((s) => s.tipOpen);
  const { nextTip, setTipOpen } = useLab.getState();
  const model = findLabLesson(lessonId)?.models.find((m) => m.id === modelId);
  if (!model) return null;
  const tips = model.tryThis;
  if (!tipOpen)
    return (
      <button className="ravi-dock ravi-dock--closed" onClick={() => setTipOpen(true)} aria-label="Show Ravi's tip">
        <span className="chat-launcher__avatar">R</span>
        Try this
      </button>
    );
  return (
    <aside className="ravi-dock" aria-label="Ravi's tip">
      <span className="chat-launcher__avatar">R</span>
      <div className="ravi-dock__body">
        <div className="ravi-dock__head">
          Try this · {(tipIndex % tips.length) + 1} of {tips.length}
          <button className="ravi-dock__x" onClick={() => setTipOpen(false)} aria-label="Hide tip">
            ×
          </button>
        </div>
        <p>{tips[tipIndex % tips.length]}</p>
        {tips.length > 1 && (
          <button className="ravi-dock__next" onClick={nextTip}>
            Next tip
          </button>
        )}
      </div>
    </aside>
  );
}

/** Zoom buttons for people without a scroll wheel or trackpad pinch: in, out, and back to the full model. */
export function ZoomControls() {
  const modelId = useLab((s) => s.tab.modelId);
  const sheet = useLab((s) => s.sheet);
  const def = LAB_MODELS[modelId];
  return (
    <div className={`zoom ${sheet ? "is-shifted" : ""}`} role="group" aria-label="Zoom">
      <button onClick={() => zoomBy(0.75)} aria-label="Zoom in" title="Zoom in (or scroll / pinch)">
        +
      </button>
      <button onClick={() => zoomBy(1.33)} aria-label="Zoom out" title="Zoom out">
        −
      </button>
      <button
        className="zoom__fit"
        onClick={() => {
          if (!def) return;
          useLab.getState().setStage(null);
          void frame(def.camera, true);
          setViewOffset(0, true);
        }}
        aria-label="Show the whole model"
        title="Show the whole model"
      >
        Fit
      </button>
    </div>
  );
}
