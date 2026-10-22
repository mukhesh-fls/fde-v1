import type { ModuleDef, ModuleStatus } from "../content/types";
import { LockIcon } from "./LockIcon";
import { levelLabel, statusLabel } from "./status";

type Props = { module: ModuleDef; status: ModuleStatus; unlocked: boolean; expanded: boolean };

/** The chip above a building. Collapsed it shows the flight code (and a lock); on hover it shows the module. */
export function BuildingLabel({ module, status, unlocked, expanded }: Props) {
  return (
    <div className={`bl ${unlocked ? "bl--open" : "bl--locked"} ${expanded ? "bl--expanded" : ""}`}>
      <div className="bl__chip">
        {!unlocked && <LockIcon />}
        <span className="bl__code">{module.code}</span>
        {unlocked && <span className={`bl__status bl__status--${status}`}>{statusLabel[status]}</span>}
      </div>
      {expanded && (
        <div className="bl__card">
          <div className="bl__building">{module.building.name}</div>
          <div className="bl__title">{module.title}</div>
          <div className="bl__meta">
            {levelLabel[module.level]} · {module.stations.length > 0 ? `${module.stations.length} stations · ` : ""}
            {unlocked ? "Click to go inside" : "Locked until the previous module exam is passed"}
          </div>
        </div>
      )}
    </div>
  );
}
