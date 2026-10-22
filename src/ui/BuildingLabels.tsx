import { modules } from "../content/modules";
import { registerLabel } from "../engine/labelAnchors";
import { useUi } from "../store/ui";
import { isOpenStatus, useModuleStatuses } from "../store/useModuleStatus";
import { BuildingLabel } from "./BuildingLabel";

/** DOM layer holding one label per building; positions are set by <LabelProjector>. */
export function BuildingLabels() {
  const hovered = useUi((s) => s.hoveredModuleId);
  const statuses = useModuleStatuses();
  return (
    <div className="labels" aria-hidden="true">
      {modules.map((m) => (
        <div key={m.id} ref={registerLabel(m.id)} className={`labels__item ${hovered === m.id ? "is-top" : ""}`}>
          <BuildingLabel module={m} status={statuses[m.id]} unlocked={isOpenStatus(statuses[m.id])} expanded={hovered === m.id} />
        </div>
      ))}
      <div ref={registerLabel("lab")} className={`labels__item ${hovered === "lab" ? "is-top" : ""}`}>
        <div className={`bl bl--open bl--lab ${hovered === "lab" ? "bl--expanded" : ""}`}>
          <div className="bl__chip">
            <span className="bl__code">LAB</span>
            <span className="bl__status">Open</span>
          </div>
          {hovered === "lab" && (
            <div className="bl__card">
              <div className="bl__building">AI Systems Lab</div>
              <div className="bl__title">Level 1 · Foundations, in interactive 3D</div>
              <div className="bl__meta">6 episodes · 12 models you can change · Click to go inside</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
