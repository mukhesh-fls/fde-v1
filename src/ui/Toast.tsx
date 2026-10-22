import { useEffect } from "react";
import { useUi } from "../store/ui";

/** Outside buildings, Ravi's short lines (e.g. "this building is locked") show as a toast. Inside, his bubble shows them. */
export function Toast() {
  const line = useUi((s) => s.ravisLine);
  const view = useUi((s) => s.view);
  const say = useUi((s) => s.say);
  useEffect(() => {
    if (!line) return;
    const t = setTimeout(() => say(null), view.kind === "overview" ? 4000 : 9000);
    return () => clearTimeout(t);
  }, [line, view.kind, say]);
  if (!line || view.kind !== "overview") return null;
  return (
    <div className="toast" role="status">
      <span className="chat-launcher__avatar">R</span>
      {line}
    </div>
  );
}
