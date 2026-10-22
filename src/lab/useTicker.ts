import { useEffect, useReducer } from "react";

/** Re-renders the component about ten times a second while `active`, for counters that follow an animation. */
export function useTicker(active: boolean, ms = 100) {
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(tick, ms);
    return () => clearInterval(id);
  }, [active, ms]);
}
