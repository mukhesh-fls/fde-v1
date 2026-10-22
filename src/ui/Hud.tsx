import { useEffect } from "react";
import { lessonsFor } from "../content/lessons";
import { modules, programme } from "../content/modules";
import { enterLab, goBack } from "../engine/navigation";
import { useProgress } from "../store/progress";
import { totalXp } from "../store/progressRules";
import { useUi } from "../store/ui";
import { useExplain } from "../lab/explain";
import { useLab } from "../lab/store";

/** Top bar: brand, back button inside buildings, and the scoreboard chip. Also owns the Esc key. */
export function Hud() {
  const view = useUi((s) => s.view);
  const panel = useUi((s) => s.panel);
  const openPanel = useUi((s) => s.openPanel);
  const progress = useProgress();
  const all = modules.flatMap((m) => lessonsFor(m.id));
  const certified = all.filter((l) => progress.lessons[l.id]?.certifiedAt).length;
  const building = view.kind === "building" ? modules.find((m) => m.id === view.moduleId) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const ui = useUi.getState();
      if (ui.chatOpen) return ui.setChatOpen(false);
      if (ui.view.kind === "lab") {
        const lab = useLab.getState();
        if (useExplain.getState().current) return useExplain.getState().clear();
        if (lab.episodesOpen) return lab.setEpisodesOpen(false);
        if (lab.sheet) return lab.setSheet(null);
      }
      if (ui.panel?.kind === "scoreboard") return ui.openPanel(null);
      void goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (view.kind === "lab") return null;
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true" />
          <span className="brand__name">{programme.world}</span>
        </div>
        {view.kind === "overview" && (
          <button className="back back--lab" onClick={() => void enterLab()}>
            Open the AI Systems Lab
          </button>
        )}
        {building && (
          <button className="back" onClick={() => void goBack()}>
            ← {panel && panel.kind !== "scoreboard" ? building.building.name : "Airport"}
            <kbd>Esc</kbd>
          </button>
        )}
        <button className={`score-chip ${panel?.kind === "scoreboard" ? "is-active" : ""}`} onClick={() => openPanel(panel?.kind === "scoreboard" ? null : { kind: "scoreboard" })}>
          <span>
            <strong>{totalXp(progress)}</strong> XP
          </span>
          <span className="score-chip__sep" />
          <span>
            <strong>
              {certified}/{all.length}
            </strong>{" "}
            stations
          </span>
          <span className="score-chip__link">Scoreboard</span>
        </button>
      </header>
      {view.kind === "overview" && <p className="hint">Drag to orbit · Scroll to zoom · Click Terminal 1 or the AI Systems Lab to start learning</p>}
      {view.kind === "building" && !panel && <p className="hint hint--left">Click a station, or pick one from the list · Esc to go back outside</p>}
    </>
  );
}
