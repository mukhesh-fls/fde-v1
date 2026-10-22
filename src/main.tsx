import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./app/styles.css";
import "./app/ui.css";
import "./app/lab.css";

// No StrictMode: R3F and the label projector are fine with it, but double-mounting the Canvas in dev
// recompiles every shader and slows the first frame noticeably.
createRoot(document.getElementById("root")!).render(<App />);
