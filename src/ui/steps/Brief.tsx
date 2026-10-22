export function Brief({ lines, onNext }: { lines: string[]; onNext: () => void }) {
  return (
    <div className="step">
      <div className="mentor-lines">
        {lines.map((l, i) => (
          <div key={i} className="mentor-line" style={{ animationDelay: `${i * 180}ms` }}>
            {i === 0 && <span className="mentor-line__who">Ravi</span>}
            {l}
          </div>
        ))}
      </div>
      <div className="step__actions">
        <button className="btn btn--primary" onClick={onNext}>
          Got it
        </button>
      </div>
    </div>
  );
}
