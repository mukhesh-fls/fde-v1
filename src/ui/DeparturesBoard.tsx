import { useState } from "react";
import { modules } from "../content/modules";
import { useUi } from "../store/ui";
import { isOpenStatus, useModuleStatuses } from "../store/useModuleStatus";
import { openModule } from "../world/buildings/Building";
import { statusLabel } from "./status";

const COLLAPSED_ROWS = 5;

/**
 * The module list as a departures board. Hovering a row highlights its building, and the other way round.
 * Collapsed, it shows what's boarding plus the next few flights, so the airport stays visible.
 */
export function DeparturesBoard() {
  const hovered = useUi((s) => s.hoveredModuleId);
  const setHovered = useUi((s) => s.setHovered);
  const [showAll, setShowAll] = useState(false);
  const statuses = useModuleStatuses();
  const rows = showAll ? modules : modules.slice(0, COLLAPSED_ROWS);
  return (
    <section className="board" aria-label="Departures: course modules">
      <header className="board__head">
        <span className="board__title">Departures</span>
        <span className="board__sub">AI for Tech Professionals</span>
      </header>
      <table className="board__table">
        <colgroup>
          <col style={{ width: 70 }} />
          <col />
          <col style={{ width: 150 }} />
          <col style={{ width: 96 }} />
        </colgroup>
        <thead>
          <tr>
            <th>Flight</th>
            <th>Module</th>
            <th>Gate</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr
              key={m.id}
              className={`${hovered === m.id ? "is-hovered" : ""} status-${statuses[m.id]}`}
              onClick={() => openModule(m, isOpenStatus(statuses[m.id]))}
              onMouseEnter={() => setHovered(m.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <td className="board__code">{m.code}</td>
              <td className="board__module" title={m.title}>
                {m.title}
              </td>
              <td className="board__gate" title={m.building.name}>
                {m.building.name}
              </td>
              <td>
                <span className={`pill pill--${statuses[m.id]}`}>{statusLabel[statuses[m.id]]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="board__more" onClick={() => setShowAll((v) => !v)}>
        {showAll ? "Show fewer" : `Show all ${modules.length} flights`}
      </button>
    </section>
  );
}
