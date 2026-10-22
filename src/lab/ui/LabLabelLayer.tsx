import { registerLabel } from "../../engine/labelAnchors";
import { useExplain } from "../explain";
import { useLabLabels } from "../labels";

/** DOM labels for the lab scene, plus the explanation card for whatever was last clicked. */
export function LabLabelLayer() {
  const labels = useLabLabels((s) => s.labels);
  const explain = useExplain((s) => s.current);
  const clear = useExplain((s) => s.clear);
  return (
    <div className="labels" aria-hidden={explain ? undefined : "true"}>
      {labels.map((l) => (
        <div key={l.id} ref={registerLabel(l.id)} className="labels__item">
          <div className={`ll ll--${l.tone ?? "default"} ll--${l.size ?? "md"}`}>
            <span className="ll__text">{l.text}</span>
            {l.sub && <span className="ll__sub">{l.sub}</span>}
          </div>
        </div>
      ))}
      {explain && (
        <div key={explain.key} ref={registerLabel("lab:explain")} className="labels__item is-explain">
          <div className="explain" role="dialog" aria-label={explain.title}>
            <div className="explain__head">
              <strong>{explain.title}</strong>
              <button onClick={clear} aria-label="Close explanation">
                ×
              </button>
            </div>
            {explain.body && <p>{explain.body}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
